<template>
  <v-app>
    <v-app-bar app class="primary" dark flat height=49px>
      <v-app-bar-nav-icon @click="drawer()"/>
      <v-spacer/>
      <v-icon v-if="online" color="green">mdi-wifi</v-icon>
      <v-icon v-else color="red">mdi-wifi-off</v-icon>
    </v-app-bar>

    <site-menu/>

    <v-main>
      <HelloWorld/>
    </v-main>

    <site-footer/>

    <v-snackbar :color="snackbarclass" v-model="snackbar" :timeout="timeout" rounded="pill" dark>
      {{ snackbartext }}

      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="snackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>


  </v-app>
</template>

<script>
const ipcRenderer = window.require('electron').ipcRenderer;
import SiteMenu from './components/Menu';
import HelloWorld from './components/HelloWorld';
import SiteFooter from './components/Footer';

export default {
  name: 'App',

  components: {
    SiteMenu,
    HelloWorld,
    SiteFooter
  },
  data (){
    return {
      online: false,
      snackbar: false,
      snackbarclass: "primary",
      snackbartext: '',
      timeout: 3000

    }
  },
  mounted() {
    this.$eventBus.$on('goOnlineValue', (id, v1, v2, status) => {
        console.log("main recv "+id+','+v1+','+v2+','+status)
        if (status) {
          switch(id) {
            case 0:
              //
              break;
            case 1:
              ipcRenderer.send('tcpServerStart', v2)
              break;
          }
        }
        if (!status) {
          switch(id) {
            case 0:
              //
              break;
            case 1:
              ipcRenderer.send('tcpServerClose')
              break;
          }
        }
    }),
    this.$eventBus.$on('snackBarAct', text => {
      this.snackbarOpen(text, "error")
      this.snackbar = true
    }),
    this.$eventBus.$on('sendString', text => {
      console.log('main recv = '+text)
    }),

    ipcRenderer.on('onConnect', function(e, text) {
      console.log(text)
      this.snackbarOpen(text, "primary")
      this.snackbar = true
    })
  },
  methods: {
    drawer: function () {
      this.$eventBus.$emit('drawerMenu')
    },
    snackbarOpen: function(text, putClassName) {
      this.snackbarclass = putClassName
      this.snackbartext = text
    }
  }
}
</script>
