<template>
    <div class="maximize" id="startup">
        <div>facebook</div>
		<div>instagram</div>
		<div>
			<div>username</div>
			<div>password</div>
		</div>
		<div>name: "{{userName}}"</div>
    </div>
</template>

<script>
export default {
    name: "Startup",
    components: {},
    data() {
        return {
            stack: []
        };
    },
    mounted: function() {},
    methods: {},
	computed: {
		userName() {
			return this.$store.user.displayName;
		}
	}
};
</script>

<style lang="scss">
.startup {
}
</style>
