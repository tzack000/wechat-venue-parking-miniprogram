// components/empty/empty.js
Component({
  properties: {
    icon: {
      type: String,
      value: '📭'
    },
    text: {
      type: String,
      value: '暂无数据'
    },
    showButton: {
      type: Boolean,
      value: false
    },
    buttonText: {
      type: String,
      value: ''
    }
  },
  methods: {
    onButtonTap() {
      this.triggerEvent('buttontap')
    }
  }
})
