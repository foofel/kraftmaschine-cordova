<template>
    <div class="maximize" id="startup">
        <div>facebook</div>
		<div>instagram</div>
		<div>
			<div class="text-teal-200">username</div>
			<div>password</div>
		</div>
		<div>name: "{{userName}}"</div>
    </div>
</template>

<script>
import "@/assets/styles/tailwind.css"
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
