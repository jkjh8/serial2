<template>
  <v-app>
    <v-app-bar app class="blue-grey darken-2" dark flat >
      <v-app-bar-nav-icon @click="drawer=!drawer"/>
      <v-spacer/>
      <!-- <v-chip-group>
        <v-chip color="secondary" text-color="white" outlined>Show Acsii</v-chip>
      </v-chip-group> -->
      <v-icon v-if="online" color="green" class="px-3 ">mdi-wifi</v-icon>
      <v-icon v-else color="red" class="px-3">mdi-wifi-off</v-icon>
    </v-app-bar>

    <v-navigation-drawer app v-model="drawer" fixed >
      <site-menu />
    </v-navigation-drawer>
    <v-main>
      <!-- <v-alert 
        :value="alert"
        color="pink"
        dark
        border="top"
        icon="mdi-home"
        transition="scale-transition"
        >
        {{ alertMessage }}
      </v-alert> -->
        
      <v-container>
        
        <v-card>
          <v-data-table :headers="headers" :items="items" :sort-by="sortby" :sort-desc="sortdesc" dense>
              <!-- <template v-slot:items.msg="{ items }">
                {{ items.msg.toString('hex') }}
                console.log(items.msg)
              </template> -->
              <!-- <template v-slot:item.msg="{ item }">
                {{ item.msg }}
              </template> -->
          </v-data-table>
        </v-card>
      </v-container>
    </v-main>

    <site-footer/>

    <v-dialog
      v-model="dialog"
      max-width="290"
    >
      <v-card>
        <v-card-title class="headline">
          Error
        </v-card-title>

        <v-card-text>
          {{ alertMessage }}
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="dialog = false">
            확인
          </v-btn>
        </v-card-actions>
      </v-card>
    
    </v-dialog>
  </v-app>
</template>

<script>
const ipcRenderer = window.require('electron').ipcRenderer;
import SiteMenu from './components/Menu';
import SiteFooter from './components/Footer';
// let onlineState = [false, false, false, false, false]

export default {
  name: 'App',

  components: {
    SiteMenu,
    SiteFooter
  },
  data (){
    return {
      dialog: false,
      alertMessage: '',
      drawer: true,
      online: false,
      sortby: 'createAt',
      sortdesc: true,
      headers: [
          {value:'createAt', text: '시간', width: '180px'},
          {value:'protocol', text: '프로토콜', width: '100px'},
          {value: 'from', text: '발신', width: '100px'},
          {value: 'msg', text: '값'}
      ],
      items : [],
      onlineSerial: false,
      onlineTcpserver: false,
    }
  },
  mounted() {
    ipcRenderer.on('rtMsg', (e, msg) => {
      this.items = msg
    })
    ipcRenderer.on('onlineStatus',(e, status) => {
      for (let v in status) {
        if (status[v] === true) {
          this.online = true
          return
        } else {
          this.online = false
        }
      }
    })
    ipcRenderer.on('alert' , (e, msg) => {
      this.alertMessage = msg
      this.dialog = true
    })
  },
  methods: {
//
  }
}
</script>

<style>

</style>
