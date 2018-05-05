export default {
    data() {
        return { data1: '' };
    },
    'onInit'() {
        this.$watch('data1', '_kyy_watch_data1');
    },
    _kyy_watch_data1() {
        console.log('data1 changed');
    }
};