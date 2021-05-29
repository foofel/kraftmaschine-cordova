import { Vue } from 'vue-property-decorator'
import { NavigationComponent, NavigationLeaveResponse } from '@/components/typeexports';

export class VueNavigation extends Vue implements NavigationComponent {
    constructor() {
        super();
    }
    canLeaveComponent(): NavigationLeaveResponse  {
        return "ok";
    }
    onBeforeShowDialog(): void {}
}

export const VueNavigationMixin = {
    methods: {
        canLeaveComponent(): NavigationLeaveResponse {
            return "ok";
        },
        onBeforeShowDialog(): void {}
    }
}