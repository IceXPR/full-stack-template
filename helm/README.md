# full-stack-template Helm Chart

This Helm chart deploys the full-stack-template application, consisting of a frontend and a backend service.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- Traefik 3 ingress controller
- cert-manager (for TLS)

## Installing the Chart

1. Clone this repository:

```bash
git clone <repository-url>
cd helm
```

2. Customize the values in `values.yaml` according to your environment.

3. Before installing, set your Docker registry credentials:

```bash
# Edit values.yaml or use --set options to configure registry credentials
# Example:
helm install full-stack-template . --set imagePullSecrets.registry=docker.io --set imagePullSecrets.username=myuser --set imagePullSecrets.password=mypassword
```

4. Install the chart:

```bash
helm install full-stack-template .
```

## Configuration

The following table lists the configurable parameters for this chart and their default values.

### Global Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.environment` | Environment name | `production` |

### Image Pull Secret Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `imagePullSecrets.create` | Enable creation of image pull secret | `true` |
| `imagePullSecrets.registry` | Docker registry URL | `docker.io` |
| `imagePullSecrets.username` | Docker registry username | `""` |
| `imagePullSecrets.password` | Docker registry password | `""` |

### Ingress Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `traefik` |
| `ingress.annotations` | Ingress annotations | See `values.yaml` |
| `ingress.hosts` | Ingress hosts configuration | See `values.yaml` |
| `ingress.tls` | Ingress TLS configuration | See `values.yaml` |

## Frontend and Backend Configuration

Each service (frontend and backend) has its own configuration values. See `charts/frontend/values.yaml` and `charts/backend/values.yaml` for details.

## Security Features

This chart includes several security features:

- Secure pod security contexts
- Network policies to restrict traffic
- Resource limits
- TLS for ingress
- Service accounts with least privilege
- Private container registry authentication

## Uninstalling the Chart

```bash
helm uninstall full-stack-template
``` 