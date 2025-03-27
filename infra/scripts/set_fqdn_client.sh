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