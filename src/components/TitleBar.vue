<template>
    <div>
        <v-toolbar-title>Page Title</v-toolbar-title>
        <v-spacer/>
        <v-icon v-if="online" color="green">mdi-wifi</v-icon>
        <v-icon v-else color="red">mdi-wifi-off</v-icon>
    </div>    
</template>

<script>
export default {
  props: {
      //
  },
  data () {
      return {
          online: true
      }
  }
};
</script>
