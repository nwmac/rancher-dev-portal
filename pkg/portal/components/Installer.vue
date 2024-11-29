<script>
import { CATALOG, SCHEMA, MANAGEMENT, NORMAN } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { ensureHelmRepository, getHelmChart, installHelmChart } from '../utils/helm';
import Banner from '@components/Banner/Banner.vue';

// If we add the Helm chart, this is the name we will use
const HELM_REPOSITORY_NAME = 'rancher-developer-portal';

// Helm repository URL
const HELM_REPOSITORY_URL = 'https://nwmac.github.io/backstage';

// Helm chart we will install from the repository
const HELM_CHART_NAME = 'rancher-developer-portal';

export default {
  name: 'Installer',
  components: {
    Banner,
  },

  emits: ['installed'],
  props:      {
    // config: {
    //   type:     'Object',
    //   required: true
    // }
    // resource: {
    //   type:     String,
    //   required: true,
    // },

    noPermissions: {
      type:     Boolean,
      required: false,
    },
  },
  data() {
    console.error('--------');

    console.error(this.$router);
    console.error(this.$route);

    return {
      haveSchema:   false,
      schema:       undefined,
      haveHelmRepo: false,
      repos:        [],
      versionInfo:  undefined,
      busy:         false,
      error:        '',
      // resource:     SUMA_SERVER,
      noPermission: this.noPermissions,
      msg: '',
    };
  },

  async fetch() {
    if (this.noPermissions) {
      return;
    }

    if (this.$store.getters['management/schemaFor'](CATALOG.CLUSTER_REPO)) {
      this.repos = await this.$store.dispatch('management/findAll', { type: CATALOG.CLUSTER_REPO, opt: { force: true } });
      this.haveHelmRepo = this.repos.find((r) => { return r.spec?.url === HELM_REPOSITORY_URL });
    } else {
      this.noPermission = true;
    }
  },

  // computed: {
  //   allSchemas() {
  //     return this.$store.getters[`management/all`](SCHEMA);
  //   }
  // },

  // watch: {
  //   allSchemas(neu, old) {
  //     const n = neu?.find((s) => s.id === this.resource);

  //     if ((!this.haveSchema && n) || (this.haveSchema && !n)) {
  //       this.$router.replace({
  //         name: 'c-cluster-manager-suse-manager',
  //         path: '/c/:cluster/manager/suse-manager',
  //         params: {
  //           product: 'manager',
  //           cluster: '_',
  //         }
  //       });
  //     }
  //   }
  // },

  methods: {
    async createApiToken() {
      const maxTTLSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, 'auth-token-max-ttl-minutes');
      let maxTTL = 0;

      try {
        maxTTL = parseInt(maxTTLSetting.value || maxTTLSetting.default, 10);
      } catch (e) {
        maxTTL = 0;
      }      

      const token = await this.$store.dispatch('rancher/create', {
        type: NORMAN.TOKEN,
        description: 'Rancher Developer Portal',
      });

      const created = await token.save();

      return created.token;
    },

    async httpReady(url) {
      let ready = false;
      let tries = 0;

      while (!ready) {
        try {
          const response = await fetch(url);

          console.log(response);

          if (response.status === 200) {
            return true;
          }
        } catch (e) {
          console.error(e);
        }
        
        tries++;

        if (tries > 20) {
          throw new Error('Timed out waiting for installation to be ready');
        }

        await new Promise(r => setTimeout(r, 5000));
      }
    },

    async enable() {
      // TODO: Check permissions

      this.busy = true;
      this.error = '';

      const serverUrlSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SERVER_URL);
      const serverUrl = serverUrlSetting?.value;

      this.msg = 'Installing ...';

      try {
        const token = await this.createApiToken();
        const helmRepo = await ensureHelmRepository(this.$store, HELM_REPOSITORY_URL, HELM_REPOSITORY_NAME);
        const helmChart = await getHelmChart(this.$store, helmRepo, HELM_CHART_NAME);
        const res = await installHelmChart(helmRepo, helmChart, {
          rancher: {
            serverUrl,
            token
          }
        }, 'cattle-portal');

        this.msg = 'Waiting for installation to be ready ...';

        await this.httpReady(`/api/v1/namespaces/cattle-portal/services/https:rancher-developer-portal:7007/proxy/api/auth/rancher/refresh`);

        this.busy = false;

        this.$emit('installed');
      } catch (e) {
        this.error = e;
        this.busy = false;
      }
    }
  }
};
</script>

<template>
  <div class="suma-install">
    <div class="suma-panel">
      <slot></slot>
      
      <p>The Rancher Developer Portal is not installed</p>
      <!-- <p>This component is required in order for the UI to communicate with your SUSE Manager instance(s).</p> -->

      <div v-if="noPermission">
        <p>Please contact your system administrator for installation of this feature</p>
      </div>
      <button
        v-else
        class="btn role-primary"
        :disabled="busy"
        @click="enable()"
      >
        Install
      </button>
      <div
        v-if="busy"
        class="suma-loading"
        >
        <i class="icon icon-spinner icon-spin" />
        {{ msg }}
        </div>
      <Banner
        v-if="error"
        color="error"
        >{{ error }}
      </Banner>
    </div>
  </div>
</template>
<style lang="scss" scoped>
  .suma-panel {
    align-items: center;
    display: flex;
    flex-direction: column;

    p {
      margin: 5px 0;
    }

    button {
      margin-top: 20px;
    }    

    .title {
      margin: 20px 0;
      font-size: 24px;
      // height: 96px;
    }

    img {
      width: 96px;
    }
  }

  .suma-loading {
    align-items: center;
    display: flex;
    margin: 20px 0;

    > i {
      margin-right: 5px;
    }
  }

  .suma-panel-indent {

  }
</style>
