echo "Updating DNS record for webmud.kirbytoso.xyz."
        
        # Get the game-service FQDN
        WEBMUD_CLIENT=$(az containerapp show \
          --resource-group rg-$AZURE_ENV_NAME \
          --name webmud-client \
          --query properties.configuration.ingress.fqdn \
          --output tsv)
        
        # Update DNS records
        az network dns record-set cname set-record \
          --resource-group kirbytosodomain \
          --zone-name kirbytoso.xyz \
          --record-set-name webmud \
          --cname $WEBMUD_CLIENT
        
        echo "DNS record updated successfully."
        
        # Get the container apps environment name
        CONTAINER_ENV_NAME=$(az containerapp show \
          --resource-group rg-$AZURE_ENV_NAME \
          --name webmud-client \
          --query properties.environmentId \
          --output tsv | sed 's|.*/||')
        
        echo "Creating managed certificate for webmud.kirbytoso.xyz..."
        
        # Create managed certificate
        az containerapp env certificate create \
          --resource-group rg-$AZURE_ENV_NAME \
          --name $CONTAINER_ENV_NAME \
          --certificate-name webmud-cert \
          --hostname webmud.kirbytoso.xyz \
          --validation-method CNAME
        
        echo "Waiting for certificate to be provisioned..."
        
        # Wait for certificate to be successfully provisioned
        while true; do
          CERT_STATUS=$(az containerapp env certificate show \
            --resource-group rg-$AZURE_ENV_NAME \
            --name $CONTAINER_ENV_NAME \
            --certificate-name webmud-cert \
            --query properties.provisioningState \
            --output tsv 2>/dev/null || echo "NotFound")
          
          if [ "$CERT_STATUS" = "Succeeded" ]; then
            echo "Certificate provisioned successfully."
            break
          elif [ "$CERT_STATUS" = "Failed" ]; then
            echo "Certificate provisioning failed. Exiting."
            exit 1
          else
            echo "Certificate status: $CERT_STATUS. Waiting 30 seconds..."
            sleep 30
          fi
        done
        
        echo "Binding managed certificate to container app..."
        
        # Bind certificate to container app
        az containerapp hostname bind \
          --resource-group rg-$AZURE_ENV_NAME \
          --name webmud-client \
          --hostname webmud.kirbytoso.xyz \
          --environment $CONTAINER_ENV_NAME \
          --certificate webmud-cert
        
        echo "Managed certificate created and bound successfully."