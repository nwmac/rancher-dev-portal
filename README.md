# Rancher Developer Portal UI Extension

This is a Hackweek project.

This is a proof of concept UI Extension for embedding Backstage inside of Rancher.

This repository provides the UI Extension. The UI Extension will help the user to install
the required Helm chart that installs Backstage.

The Backstage application is in this repository: https://github.com/nwmac/backstage

## Installation

In Rancher, add a new http Helm Repository with the Index URL of `https://nwmac.github.io/backstage`.

Go to `Extensions` in the side bar and install the `Rancher Developer Portal` extension and reload.

You will now see a Backstage icon in the side bar. Click on this to access the developer portal. On first use, this will
guide you through installing the required backend Helm chart.



