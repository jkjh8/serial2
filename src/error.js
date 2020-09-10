import Vue from 'vue'

Vue.config.errorHandler = e => {
    console.log(e.message)
    // Vue.prototype.$toast.error(e.message)
}