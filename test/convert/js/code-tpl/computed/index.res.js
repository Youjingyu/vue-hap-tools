export default {
    data() {
        return {
            data1: '',
            data2: ''
        };
    },
    'onInit'() {
        Object.defineProperty(this, 'data1', {
            get: function () {
                return this.data.id + 1;
            }
        });
        Object.defineProperty(this, 'data2', {
            get: function () {
                return filter(this.data.list);
            }
        });
    }
};