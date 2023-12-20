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
  region     = "us-west1"
}

provider "google" {
  project                     = local.project_id
  impersonate_service_account = "deployer@${local.project_id}.iam.gserviceaccount.com"
  region                      = local.region
}

resource "google_project_service" "storage" {
  service = "storage.googleapis.com"
}

resource "google_project_service" "generativelanguage" {
  service = "generativelanguage.googleapis.com"
}

resource "google_storage_bucket" "assets" {
  project                     = google_project_service.storage.project
  name                        = "${local.project_id}-assets"
  location                    = "US"
  uniform_bucket_level_access = true
}

resource "google_storage_bucket_iam_member" "public_assets" {
  bucket = google_storage_bucket.assets.name
  role   = "roles/storage.legacyObjectReader"
  member = "allUsers"
}

resource "google_project_iam_custom_role" "users" {
  role_id     = "docsummaryUser"
  title       = "DocSummary User"
  permissions = ["aiplatform.endpoints.predict"]
}
