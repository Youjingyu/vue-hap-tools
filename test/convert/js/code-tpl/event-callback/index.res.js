export default {
    eventCallback(event) {
        event.target.checked = event.checked;
        this.inputVal = event.target.checked;
        console.log(event.target.checked);
    },
    '_kyy_v_model_change_inputVal2'(e) {
        e.target.value = e.value;
        this.inputVal2 = e.target.value;
    }
};