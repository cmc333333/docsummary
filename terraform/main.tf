terraform {
  backend "gcs" {
    bucket                      = "cm-docsummary-deployment-state"
    impersonate_service_account = "deployer@cm-docsummary.iam.gserviceaccount.com"
  }

  required_providers {
    google = "~> 5.9.0"
  }
}

locals {
  project_id = "cm-docsummary"
  region = "us-west1"
}

provider "google" {
  project                     = local.project_id
  impersonate_service_account = "deployer@${local.project_id}.iam.gserviceaccount.com"
  region                      = local.region
}