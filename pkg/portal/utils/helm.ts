import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { CONSTRAINT_VIOLATION_MESSAGE } from '@shell/config/table-headers';
import { CATALOG, SCHEMA, MANAGEMENT } from '@shell/config/types';

const MAX_RETRIES = 10;
const RETRY_WAIT = 2500;

export type HelmRepository = any;
export type HelmChart = any;

/**
 * Install Helm Chart
 * 
 * Note: This should really be provided via the shell rather than copied here
 */
export async function installHelmChart(repo: any, chart: any, values: any = {}, namespace = 'default') {
  /*
    Refer to the developer docs at docs/developer/helm-chart-apps.md
    for details on what values are injected and where they come from.
  */
  // TODO: This is needed in order to support system registry for air-gapped environments
  // this.addGlobalValuesTo(values);

  console.error(chart);

  const chartInstall = {
    chartName:   chart.name,
    version:     chart.version,
    releaseName: chart.name,
    description: chart.name,
    // description: ''.description,
    annotations: {
      [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: chart.repoType,
      [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: chart.repoName
    },
    values,
  };

  /*
    Configure Helm CLI options for doing the install or
    upgrade operation.
  */
  const installRequest = {
    charts:    [chartInstall],
    noHooks:   false,
    timeout:   '600s',
    wait:      true,
    namespace,
    projectId: '',
    disableOpenAPIValidation: false,
    skipCRDs: false,
  };

  // Install the Chart
  const res = await repo.doAction('install', installRequest);

  return res;
}

/**
 * Ensure the required Helm Repository exits, if it does not, add it with the specified name
 * 
 * Wait until the newly added repository has been downloaded
 */

export async function ensureHelmRepository(store: any, url: string, name: string): Promise<HelmRepository> {
  let helmRepo;

  if (store.getters['management/schemaFor'](CATALOG.CLUSTER_REPO)) {
    const repos = await store.dispatch('management/findAll', { type: CATALOG.CLUSTER_REPO, opt: { force: true, watch:false } });

    helmRepo = repos.find((r: any) => { return r.spec?.url === url });
  } else {
    throw new Error('No permissions')
  }

  // Add the Helm repository, if it is not there
  if (!helmRepo) {
    const data = {
      type: CATALOG.CLUSTER_REPO,
      metadata: {
        name
      },
      spec: {
        url
      }
    };

    // Create a model for the new repository and save it
    const repo = await store.dispatch('management/create', data);

    helmRepo = await repo.save();
  }

  console.log(helmRepo);

  // Poll the repository until it says it has been downloaded
  let fetched = false;
  let tries = 0;

  while (!fetched) {
    const repo = await store.dispatch('management/find', {
      type: CATALOG.CLUSTER_REPO,
      id:   helmRepo.id, // Get the ID from the Helm Repository
      opt:  { force: true, watch: false }
    });

    tries++;

    const downloaded = repo.status.conditions.find((s: any) => s.type === 'Downloaded');

    if (downloaded) {
      if (downloaded.status === 'True') {
        fetched = true;
      }
    }

    if (!fetched) {
      tries++;

      if (tries > MAX_RETRIES) {
        throw new Error('Failed to add Helm Chart Repository');
      }

      await new Promise(r => setTimeout(r, RETRY_WAIT));
    }

    fetched = true;
  }

  // Return the Helm Repository
  return helmRepo;
}

/**
 * Get the given Helm Chart from the specified Helm Repository
 * @param store Store
 * @param repository Helm Repository
 * @param chartName Helm Chart name
 * @returns Helm Chart
 */
export async function getHelmChart(store: any, repository: any, chartName: string): Promise<HelmChart> {
  const versionInfo = await store.dispatch('management/request', {
    method: 'GET',
    url: `${repository?.links?.info}&chartName=${ chartName }`,
  });

  console.error(versionInfo);

  // `Unable to locate the required Helm Chart '${ HELM_CHART_NAME }' in the Helm Repository '${ this.haveHelmRepo.metadata.name }'`;

  return versionInfo.chart;
}
