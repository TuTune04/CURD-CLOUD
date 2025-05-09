# Simple CRUD Web Application

A simple CRUD (Create, Read, Update, Delete) web application built with Node.js, Express, and PostgreSQL.

## Prerequisites

- Docker and Docker Compose
- Azure CLI
- Azure subscription

## Local Development

1. Clone this repository
2. Create a `.env` file based on `.env.example`
3. Build and run the Docker container:

```bash
docker build -t crud-web-app .
docker run -p 3000:3000 --env-file .env crud-web-app
```

## Azure Deployment Steps

### 1. Create a Docker Image and push to Azure Container Registry

```bash
# Login to Azure
az login

# Create a resource group
az group create --name myResourceGroup --location eastus

# Create an Azure Container Registry
az acr create --resource-group myResourceGroup --name myCrudAppRegistry --sku Basic

# Login to the registry
az acr login --name myCrudAppRegistry

# Build and tag the Docker image
docker build -t myCrudAppRegistry.azurecr.io/crud-web-app:v1 .

# Push the image to Azure Container Registry
docker push myCrudAppRegistry.azurecr.io/crud-web-app:v1

# Make ACR admin enabled to be able to use it with App Service
az acr update --name myCrudAppRegistry --admin-enabled true
```

### 2. Create an Azure Database for PostgreSQL

```bash
# Create PostgreSQL server
az postgres server create \
  --resource-group myResourceGroup \
  --name my-postgres-server \
  --location eastus \
  --admin-user postgresadmin \
  --admin-password <your-password> \
  --sku-name B_Gen5_1 \
  --version 11

# Configure firewall rule to allow all Azure services
az postgres server firewall-rule create \
  --resource-group myResourceGroup \
  --server my-postgres-server \
  --name AllowAllAzureIPs \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create a database
az postgres db create \
  --resource-group myResourceGroup \
  --server-name my-postgres-server \
  --name crud_db
```

### 3. Create an Azure Web App using the Docker image

```bash
# Get the registry credentials
ACR_USERNAME=$(az acr credential show --name myCrudAppRegistry --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name myCrudAppRegistry --query passwords[0].value --output tsv)

# Create an App Service plan
az appservice plan create \
  --name myAppServicePlan \
  --resource-group myResourceGroup \
  --sku B1 \
  --is-linux

# Create a web app
az webapp create \
  --resource-group myResourceGroup \
  --plan myAppServicePlan \
  --name myCrudWebApp \
  --deployment-container-image-name myCrudAppRegistry.azurecr.io/crud-web-app:v1 \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD

# Configure the web app with environment variables
az webapp config appsettings set \
  --resource-group myResourceGroup \
  --name myCrudWebApp \
  --settings \
  NODE_ENV=production \
  DATABASE_URL="postgres://postgresadmin:<your-password>@my-postgres-server.postgres.database.azure.com:5432/crud_db?sslmode=require"
```

### 4. Create an Azure VM for the Web Application

```bash
# Create a VM
az vm create \
  --resource-group myResourceGroup \
  --name myCrudVM \
  --image UbuntuLTS \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard

# Open ports for web traffic
az vm open-port \
  --resource-group myResourceGroup \
  --name myCrudVM \
  --port 80 --priority 100
az vm open-port \
  --resource-group myResourceGroup \
  --name myCrudVM \
  --port 443 --priority 101

# SSH into the VM and install Docker
# ssh azureuser@<vm-ip-address>
# sudo apt-get update
# sudo apt-get install -y docker.io
# sudo systemctl start docker
# sudo systemctl enable docker
# sudo usermod -aG docker $USER
# newgrp docker

# On the VM, set up your application
# git clone <your-repo>
# cd <your-repo>
# echo "DATABASE_URL=postgres://postgresadmin:<your-password>@my-postgres-server.postgres.database.azure.com:5432/crud_db?sslmode=require" > .env
# echo "NODE_ENV=production" >> .env
# docker build -t crud-web-app .
# docker run -d -p 80:3000 --env-file .env crud-web-app
```

## Testing the Connection

After deployment, you should be able to access your web app at:
- App Service: https://myCrudWebApp.azurewebsites.net
- VM: http://<vm-ip-address>

The web application should be connected to your Azure PostgreSQL database. 