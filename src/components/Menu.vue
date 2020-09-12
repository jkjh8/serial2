<template>
  <v-navigation-drawer app v-model="drawer" fixed >
     <!-- 제목 -->
    <v-list-item>
      <v-list-item-content class='main-title'>
        <v-list-item-title class="title">Connect Setup</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-divider/>

    <!-- 리스트 시작 -->
    <v-list dense>
      <!-- 메인 아이템 -->
      <v-list-group v-for="(item, i) in items" :key="i" :prepend-icon="item.icon" sub-group>
        <template v-slot:activator>    
          <v-list-item-content>
            <v-list-item-title>
                {{ item.title }}
                <v-icon v-if='item.online' size=16 color='teal darken-2'>mdi-wifi</v-icon>
            </v-list-item-title>                       
          </v-list-item-content>
        </template>

        <!-- 서브 아이템 -->
        <v-list-item v-for="(subItem, j) in item.items" :key="j">
          <v-list-item-content v-if="i === 0">
            <v-select :label="subItem.title" :items="subItem.items" :value="subItem.value" @change="changeValue(i,j,value=$event)" hide-details dense/>
          </v-list-item-content>

          <v-list-item-content v-else>
            <v-text-field :label="subItem.title" v-model="subItem.model" :placeholder="subItem.placeholder" @change="changeValue(i,j,value=$event)" hide-details dense/>
          </v-list-item-content>
        </v-list-item>

        <!-- 온라인 버튼 -->
        <v-list-item>
          <v-list-item-title>Online</v-list-item-title>
          <v-spacer/> 
          <v-switch :value="item.value" v-on:change="goOnline(i,value=$event)"></v-switch>
        </v-list-item>
      </v-list-group>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
let commValue = new Array(5);
for (let i = 0;i< commValue.length; i++) {
  commValue[i] = new Array(2);
}

export default {
  props: ['onlineStatus'],
  methods: {
    goOnline: function (id) {
      let v1 = commValue[id][0]; let v2 = commValue[id][1]
      if (v1===''||v2===''||v1===undefined||v2===undefined||v1===null||v2===null) {
        if (this.value === true) {
          this.$eventBus.$emit('snackBarAct', "error");
          this.items[id].value = false;
        }
      }
      else {
        this.$eventBus.$emit('goOnlineValue', id, v1, v2, this.value)
      }
    },

    changeValue: function(i,j,value) { commValue[i][j] = value; console.log(commValue);}
  },
    mounted() {
      commValue[0][0] = 'COM1'
      commValue[0][1] = '9600'
      this.$eventBus.$on('serialOnlineRt', (value) => {
          this.items[0].online = value
          // console.log(this.items[0])
      }),
      this.$eventBus.$on('drawerMenu', () => {
        this.drawer = !this.drawer
      })
    },
  data () {
    return {
      items: [
      // 시리얼
        {
          title: 'Serial',
          active: true,
          online: false,
          value: false,
          icon: 'mdi-serial-port',
          items: [
            { title: 'COM',  value: 'COM1', items: ['COM1','COM2','COM3','COM4','COM5','COM6','COM7','COM8']},
            { title: 'BUAD', value: '9600', items: ['9600','14400','19200','28800','38400','57600','115200']},
          ],
        },
      //TCP 서버
        {
          title: 'TCP Server',
          online: false,
          value: false,
          icon: 'mdi-server',
          items: [
            { 
              title: 'IP',
              placeholder: 'localhost'
            },
            {
              title: 'PORT',
            },
          ],
        },
        //TCP 클라이언트
        {
          title: 'TCP Client',
          online: false,
          value: false,
          icon: 'mdi-ethernet',
          items: [
            { 
              title: 'IP',
            },
            {
              title: 'PORT',
            },
          ],
        },
        //UDP 서버
        {
          title: 'UDP Server',
          online: false,
          value: false,
          icon: 'mdi-server-network',
          items: [
            { 
              title: 'IP',
              placeholder: 'localhost',
            },
            {
              title: 'PORT',
            },
          ],
        },
        //UDP 클라이언트
        {
          title: 'UDP Client',
          online: false,
          value: false,
          icon: 'mdi-network',
          items: [
            { 
              title: 'IP',
            },
            {
              title: 'PORT',
            },
          ],
        },
      ],
      drawer: true,
      mini: false,
    }
  },
}
</script>

<style>
  .v-text-field input{font-size: 0.8em;}
  .v-text-field label{font-size: 0.8em;}
  .v-select__selections{font-size: .8em;}
  .main-title {
    background-color: none;
    padding: 0px;
    margin: 0px;}
</style>