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
      <Main/>
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
import Main from './components/Main';
import SiteFooter from './components/Footer';
let onlineState = [false, false, false, false, false]

export default {
  name: 'App',

  components: {
    SiteMenu,
    Main,
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
      ipcRenderer.send('OnConnect', JSON.stringify(obj))        
    }),
    this.$eventBus.$on('snackBarAct', text => {
      this.snackbarOpen(text, "error")
      this.snackbar = true
    }),
    this.$eventBus.$on('sendString', msg => {
      console.log('main recv = '+ msg)
      ipcRenderer.send('sendMsg', msg)
      this.$eventBus.$emit('addMsg', 'TCP Serv', 'This', msg)
    }),
    ipcRenderer.on('rtMsg', (e, id, from, msg) =>{
      this.$eventBus.$emit('addMsg', id, from, msg)      
    })
    ipcRenderer.on('onlineState', (e, id, value) => {
      onlineState[id] = value;
      for (let module of onlineState) {
        console.log(module)
        if (module === true) {
          this.online = true
          break
        }
        this.online = false
      }
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

<style>

</style>
