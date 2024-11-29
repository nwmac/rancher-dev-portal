<script>
import { SERVICE } from '@shell/config/types';
import Installer from '../components/Installer';

const PORTAL_NAMESPACE = 'cattle-portal';
const PORTAL_APP_NAME = 'rancher-developer-portal';

export default {
  name: 'MyCustomPage',
  
  layout: 'plain',

  components: {
    Installer,
  },

  async fetch() {
    if (this.$store.getters['management/schemaFor'](SERVICE)) {
      // Can we find the service, if not, then it needs to be installed
      this.service = await this.$store.dispatch('management/find', {
        type:      SERVICE,
        id:        `${ PORTAL_NAMESPACE }/${ PORTAL_APP_NAME }`,
      });
    } else {
      noPermissions = true;
    }
  },

  data() {
    return {
      loaded:  false,
      service: false,
      noPermissions: false,
    };
  },

  computed: {
    portalUrl() {
      return `/api/v1/namespaces/${ PORTAL_NAMESPACE }/services/https:${ PORTAL_APP_NAME }:7007/proxy`;
    }
  },

  mounted() {
    // Embedded page visited, so cancel time to remove IFRAME when inactive
    //clearEmberInactiveTimer();
    window.addEventListener('message', this.receiveMessage);
    //this.initFrame();
  },

  beforeUnmount() {
    window.removeEventListener('message', this.receiveMessage);
  },

  methods: {
    async installComplete() {
      this.service = await this.$store.dispatch('management/find', {
        type: SERVICE,
        id:   `${ PORTAL_NAMESPACE }/${ PORTAL_APP_NAME }`,
      });
    },
    removeMessageHook() {
      window.removeEventListener('message', this.receiveMessage);
    },
    receiveMessage(msg) {
      if (!this.loaded) {
        if (msg.data === 'backstage-loaded') {
          this.loaded = true;
          this.removeMessageHook();
        }
      }
    }
  }
};
</script>

<template>
  <div
    v-if="!service" 
    class="install-needed"
  >
    <Installer
      :no-permissions="noPermissions"
      @installed="installComplete"
    >
      <img src="../assets/icon.svg" class="install-logo" />
      <div class="install-msg">Rancher Developer Portal</div>
    </Installer>

  </div>
  <div
    v-else-if="!loaded"
    class="dev-portal loader"
    :class="{'hidden': loaded}"
    >
    <div class="loading-msg">
      <img src="../assets/icon.svg" />
      <div class="msg">Rancher Developer Portal</div>
      <div class="loading">Preparing ...</div>
    </div>
  </div>
  <iframe
    v-if="service"
    id="dev-portal"
    class="dev-portal"
    :class="{'iframe': !loaded}"
    :src="portalUrl"
  >
  </iframe>
</template>

<style lang="scss" scoped>
  .install-logo {
    height: 96px;
    margin-bottom: 20px;
  }

  .install-msg {
    font-size: 16px;
    font-weight: bold;
    margin: 0 0 20px 0;
  }

  .install-needed {
    display: flex;
    margin-top: 100px;
    justify-content: center;
  }

  .dev-portal {
    border: 0;
    display: flex;
    height: calc(100% - 55px);
    position: absolute;
    left: 70px;
    top: 55px;
    width: calc(100% - 70px);
  }

  .title {
    font-size: 16px;
  }

  .iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
  }

  .loader {
    align-items: center;
    display: flex;
    justify-content: center;
    // width: 100%;

    .hidden {
      display: none;
    }

    .loading-msg {
      align-items: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;

      > div {
        margin-top: 5px;

        &.msg {
          font-weight: bold;
        }

        &.loading {
          opacity: 0.9;
        }
      }

      > img {
        width: 64px;
        height: 64px;
        opacity: 0.7;
        margin-bottom: 10px;
      }
    }
  }
</style>
