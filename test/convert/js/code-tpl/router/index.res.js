import _kyy_router from '@system.router';
export default {
    onInit() {
        this.$router = _kyy_router;
        this.$route = {};
        this.$route.query = this;
        this.userInfo = new Function('return ' + this.userInfo)();
        console.log(this.$route.query.userInfo.name);
    },
    gotoTodoMVC() {
        this.$router.push({
            uri: '/TodoMVC',
            params: {
                useInfo: {
                    name: 'John',
                    id: 100
                }
            }
        });
    }
};