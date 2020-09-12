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
    this.$eventBus.$on('goOnlineValue', (id, ip, port, status) => {
      let obj ={};
      obj["protocol"] = id
      obj["ip"] = ip
      obj["port"] = port
      obj["status"] = status
      console.log(obj)
      ipcRenderer.send('OnConnect', JSON.stringify(obj))        
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
