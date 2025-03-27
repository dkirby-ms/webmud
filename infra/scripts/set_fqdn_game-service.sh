echo "Updating DNS record for webmud-testserver.kirbytoso.xyz."
        
        # Get the game-service FQDN
        GAME_SERVICE_FQDN=$(az containerapp show \
          --resource-group rg-$AZURE_ENV_NAME \
          --name game-service \
          --query properties.configuration.ingress.fqdn \
          --output tsv)
        
        # Update DNS records
        az network dns record-set cname set-record \
          --resource-group kirbytosodomain \
          --zone-name kirbytoso.xyz \
          --record-set-name webmud-testserver \
          --cname $GAME_SERVICE_FQDN
        
        echo "DNS record updated successfully."