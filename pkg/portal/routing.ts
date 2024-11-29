// definition of a "blank cluster" in Rancher Dashboard
import MyCustomPage from './pages/Home.vue';

import { PRODUCT_NAME, PAGE_NAME } from './product';

const BLANK_CLUSTER = '_';

const routes = [
  // this covers the "custom page"
  {
    name:      `${ PRODUCT_NAME }-c-cluster-${ PAGE_NAME }`,
    path:      `/${ PRODUCT_NAME }/c/:cluster/${ PAGE_NAME }`,
    component: MyCustomPage,
    meta:      {
      product: PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  },
];

export default routes;
