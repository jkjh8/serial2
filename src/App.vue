<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"/>
      <v-toolbar-title>Page Title</v-toolbar-title>
      <v-spacer/>
      <v-icon v-if="online" color="green">mdi-wifi</v-icon>
      <v-icon v-else color="red">mdi-wifi-off</v-icon>
    </v-app-bar>

    <site-menu
      v-bind:drawer="drawer"
    />

    <v-main>
      <HelloWorld/>
    </v-main>

    <site-footer/>

    <v-snackbar
      v-model="snackbar"
      :timeout="snackbarTimeout"
    >
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn
          color="blue"
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
// import { eventBus } from 'main.js';
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
      drawer: false,
      snackbar: false,
      snackbarText: '',
      snackbarTimeout: 3000,
    }
  },
  mounted() {
    this.$eventBus.$on('goOnlineValue', (id, value) => {
        console.log("main recv "+id+','+value)
    }),
    this.$eventBus.$on('snackBarAct', text => {
      this.snackbarText = text
      this.snackbar = true
    })
  }
}
</script>
