import Vue from "vue";

const TrippleComponent = Vue.component('tripple-progress', {
    data: function () {
      return {
        rep: 0,
        set: 0,
        total: 0,
        width: 512,
        height: 512,
        exampleContent: "lol"
      }
    },
    methods: {
      updateCanvas: function () {
        const canvas = (this.$refs.canvas as HTMLCanvasElement);
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        this.redraw(ctx, canvas);
      },
      fixCanvasScaling: function() {
        const canvas = (this.$refs.canvas as HTMLCanvasElement);
        const ctx = canvas.getContext('2d') as any;
        const PIXEL_RATIO = (function () {
          const dpr = window.devicePixelRatio || 1;
          const bsr = ctx.webkitBackingStorePixelRatio ||
          ctx.mozBackingStorePixelRatio ||
          ctx.msBackingStorePixelRatio ||
          ctx.oBackingStorePixelRatio ||
          ctx.backingStorePixelRatio || 1;
          return dpr / bsr;
        })();
        const ratio = PIXEL_RATIO;
        const oldWidth = canvas.width;
        const oldHeight = canvas.height;
        canvas.width = oldWidth * ratio;
        canvas.height = oldHeight * ratio;
        canvas.style.width = oldWidth + "px";
        canvas.style.height = oldHeight + "px";
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      },
      redraw: function(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        //ctx.
      }
    },
    watch: {
      exampleContent: function(val, oldVal) {
        this.fixCanvasScaling();
        this.updateCanvas();
      }
    },
    mounted: function () {
      this.updateCanvas();
    },
    template: '<canvas id="canvas" width="500px" height="500px" ref="canvas" style="border:1px solid #BBB" />'
  })

  export { TrippleComponent }