#!/bin/bash
# Script to install MongoDB command-line tools on Ubuntu Server

echo "Installing MongoDB command-line tools..."

# Import MongoDB public GPG key
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg \
   --dearmor

# Create a list file for MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB tools package only (without the server)
sudo apt-get install -y mongodb-org-tools mongodb-mongosh

echo "MongoDB command-line tools installation completed."
echo "You can now use the 'mongosh' command to connect to MongoDB databases."
echo "Example usage:"
echo "  mongosh \"mongodb://username:password@hostname:port/database\""
echo ""
echo "To use the copyDb.js script:"
echo "  mongosh copyDb.js sourceUrl=mongodb://localhost:27017 targetUrl=\"mongodb://user:pass@azure-host:port/?ssl=true\""
