<template>
<div class="m-4">
    <div>provider: '{{provider}}'</div>
    <div>result: '{{result}}'</div>
</div>
</template>

<script>
import "@/assets/styles/tailwind.css"
export default {
    name: "Register",
    components: {},
    data: function() {
        return {};
    },
    mounted: function() {},
    methods: {
        login: function(type) {
            // to login stuff
            // e.g. show invalid 'toast'
        },
        show: function(page) {
            this.$router.replace(page)
        }
    },
	computed: {
        result: function() {
            return "callback result"
        },
        provider: function() {
            return this.$route.params
        }
	}
};
</script>

<style lang="scss" scoped>

</style>