@description('The location used for all deployed resources')
param location string = resourceGroup().location

@description('Tags that will be applied to all resources')
param tags object = {}


param gameServiceExists bool
@secure()
param gameServiceDefinition object
param webmudClientExists bool
@secure()
param webmudClientDefinition object

@description('Id of the user or app to assign application roles')
param principalId string

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = uniqueString(subscription().id, resourceGroup().id, location)

// Monitor application with Azure Monitor
module monitoring 'br/public:avm/ptn/azd/monitoring:0.1.0' = {
  name: 'monitoring'
  params: {
    logAnalyticsName: '${abbrs.operationalInsightsWorkspaces}${resourceToken}'
    applicationInsightsName: '${abbrs.insightsComponents}${resourceToken}'
    applicationInsightsDashboardName: '${abbrs.portalDashboards}${resourceToken}'
    location: location
    tags: tags
  }
}

// Container registry
module containerRegistry 'br/public:avm/res/container-registry/registry:0.1.1' = {
  name: 'registry'
  params: {
    name: '${abbrs.containerRegistryRegistries}${resourceToken}'
    location: location
    tags: tags
    publicNetworkAccess: 'Enabled'
    roleAssignments:[
      {
        principalId: gameServiceIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
      {
        principalId: webmudClientIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
    ]
  }
}

// Container apps environment
module containerAppsEnvironment 'br/public:avm/res/app/managed-environment:0.4.5' = {
  name: 'container-apps-environment'
  params: {
    logAnalyticsWorkspaceResourceId: monitoring.outputs.logAnalyticsWorkspaceResourceId
    name: '${abbrs.appManagedEnvironments}${resourceToken}'
    location: location
    zoneRedundant: false
  }
}

// Key Vault for secrets management
module keyVault 'br/public:avm/res/key-vault/vault:0.6.0' = {
  name: 'key-vault'
  params: {
    name: '${abbrs.keyVaultVaults}${resourceToken}'
    location: location
    tags: tags
    enablePurgeProtection: false
    enableRbacAuthorization: true
    sku: 'standard'
    roleAssignments: [
      {
        principalId: gameServiceIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
      }
      {
        principalId: webmudClientIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
      }
      {
        principalId: principalId
        principalType: 'User'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '00482a5a-887f-4fb3-b363-3b7fe8e74483') // Key Vault Administrator
      }
    ]
  }
}

module cosmosMongo 'br/public:avm/res/document-db/database-account:0.8.1' = {
  name: 'cosmosMongo'
  params: {
    name: '${abbrs.documentDBMongoDatabaseAccounts}${resourceToken}'
    location: location
    tags: tags
    locations: [
      {
        failoverPriority: 0
        isZoneRedundant: false
        locationName: location
      }
    ]
    networkRestrictions: {
      ipRules: []
      virtualNetworkRules: []
      publicNetworkAccess: 'Enabled'
    }
    mongodbDatabases: [
      {
        name: 'game-service'
      }
    ]
    secretsExportConfiguration: {
      keyVaultResourceId: keyVault.outputs.resourceId
      primaryWriteConnectionStringSecretName: 'mongodb-url'
    }
    capabilitiesToAdd: [ 'EnableServerless' ]
  }
}

module gameServiceIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'gameServiceidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}gameService-${resourceToken}'
    location: location
  }
}

module gameServiceFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'gameService-fetch-image'
  params: {
    exists: gameServiceExists
    name: 'game-service'
  }
}

var gameServiceAppSettingsArray = filter(array(gameServiceDefinition.settings), i => i.name != '')
var gameServiceSecrets = map(filter(gameServiceAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var gameServiceEnv = map(filter(gameServiceAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module gameService 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'gameService'
  params: {
    name: 'game-service'
    ingressTargetPort: 28999
    corsPolicy: {
      allowedOrigins: [
        'https://webmud-client.${containerAppsEnvironment.outputs.defaultDomain}'
      ]
      allowedMethods: [
        '*'
      ]
    }
    scaleMinReplicas: 1
    scaleMaxReplicas: 10
    secrets: {
      secureList:  union([
        {
          name: 'mongodb-url'
          identity:gameServiceIdentity.outputs.resourceId
          keyVaultUrl: cosmosMongo.outputs.exportedSecrets['mongodb-url'].secretUri
        }
      ],
      map(gameServiceSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: gameServiceFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        name: 'main'
        resources: {
          cpu: json('0.5')
          memory: '1.0Gi'
        }
        env: union([
          {
            name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
            value: monitoring.outputs.applicationInsightsConnectionString
          }
          {
            name: 'AZURE_CLIENT_ID'
            value: gameServiceIdentity.outputs.clientId
          }
          {
            name: 'CORS_ORIGIN_HOST'
            value: 'https://game-service.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MONGODB_URL'
            secretRef: 'mongodb-url'
          }
          {
            name: 'MONGODB_URI'
            secretRef: 'mongodb-url'
          }
          {
            name: 'PORT'
            value: '28999'
          }
        ],
        gameServiceEnv,
        map(gameServiceSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [gameServiceIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: gameServiceIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'game-service' })
  }
}

module webmudClientIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'webmudClientidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}webmudClient-${resourceToken}'
    location: location
  }
}

module webmudClientFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'webmudClient-fetch-image'
  params: {
    exists: webmudClientExists
    name: 'webmud-client'
  }
}

var webmudClientAppSettingsArray = filter(array(webmudClientDefinition.settings), i => i.name != '')
var webmudClientSecrets = map(filter(webmudClientAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var webmudClientEnv = map(filter(webmudClientAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module webmudClient 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'webmudClient'
  params: {
    name: 'webmud-client'
    ingressTargetPort: 3000
    scaleMinReplicas: 1
    scaleMaxReplicas: 10
    secrets: {
      secureList:  union([
        {
          name: 'mongodb-url'
          identity:webmudClientIdentity.outputs.resourceId
          keyVaultUrl: cosmosMongo.outputs.exportedSecrets['mongodb-url'].secretUri
        }
      ],
      map(webmudClientSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: webmudClientFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        name: 'main'
        resources: {
          cpu: json('0.5')
          memory: '1.0Gi'
        }
        env: union([
          {
            name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
            value: monitoring.outputs.applicationInsightsConnectionString
          }
          {
            name: 'AZURE_CLIENT_ID'
            value: webmudClientIdentity.outputs.clientId
          }
          {
            name: 'MONGODB_URL'
            secretRef: 'mongodb-url'
          }
          {
            name: 'MONGODB_URI'
            secretRef: 'mongodb-url'
          }
          {
            name: 'HOST_URL'
            value: 'https://webmud-client.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'NEXTAUTH_URL'
            value: 'https://webmud-client.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'GAME-SERVICE_BASE_URL'
            value: 'https://game-service.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'PORT'
            value: '3000'
          }
        ],
        webmudClientEnv,
        map(webmudClientSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [webmudClientIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: webmudClientIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'webmud-client' })
  }
}
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output AZURE_RESOURCE_GAME_SERVICE_ID string = gameService.outputs.resourceId
output AZURE_RESOURCE_WEBMUD_CLIENT_ID string = webmudClient.outputs.resourceId
