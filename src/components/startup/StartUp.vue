<template>
    <div class="h-screen w-screen flex justify-center" id="startup">
        <!--div>facebook</div>
		<div>instagram</div>
		<div>
			<div class="text-teal-200">username</div>
			<div>password</div>
		</div>
		<div>name: "{{userName}}"</div-->
        <div id="header" class="">
            kraft maschine
        </div>
        <div id="logins" class="">
            logins
        </div>
        <div class=""></div>
        <!--div class="grid grid-cols-1 gap-4">
            <div class="bg-red-200 text-center">
                <div class="text-3xl font-light inline-block">kraft</div>
                <div class="text-2xl font-light inline-block">maschine</div>
            </div>
            <div class="bg-red-300 text-center gap-4">
                <div>2</div>
            </div>
            <div class="bg-red-400 text-center">
                <div>3</div>
            </div>
        </div-->
        test4
    </div>
</template>

<script>
import "@/assets/styles/tailwind.css"
export default {
    name: "Startup",
    components: {},
    data: function() {
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
