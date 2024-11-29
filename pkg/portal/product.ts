// this is the definition of a "blank cluster" for Rancher Dashboard
// definition of a "blank cluster" in Rancher Dashboard
const BLANK_CLUSTER = '_';

export const PRODUCT_NAME = 'devportal';
export const PAGE_NAME = 'home';

export function init($plugin:any, store:any) {
  const YOUR_K8S_RESOURCE_NAME = 'provisioning.cattle.io.cluster';

  const {
    product,
    configureType,
    virtualType,
    basicType
  } = $plugin.DSL(store, PRODUCT_NAME);

  // registering a top-level product
  product({
    // icon:    'gear',
    svg:     require('./assets/icon.svg'),
    iconHeader: require('./assets/icon.svg'),
    inStore: 'management',
    weight:  100,
    showClusterSwitcher:   false,    
    to:      {
      name:   `${ PRODUCT_NAME }-c-cluster-${ PAGE_NAME }`,
      params: {
        product: PRODUCT_NAME,
        cluster: BLANK_CLUSTER
      }
    }
  });

  // creating a custom page
  virtualType({
    labelKey: 'some.translation.key',
    name:     PAGE_NAME,
    route:    {
      name:   `${ PRODUCT_NAME }-c-cluster-${ PAGE_NAME }`,
      params: {
        product: PRODUCT_NAME,
        cluster: BLANK_CLUSTER
      }
    }
  });
}
