function Notifications(){}Notifications.prototype={show:function(i,o,t,n){if(window.Notification){var c=new Notification(i,{body:o,icon:t});c.onclick=n,c.show()}}},module.exports=new Notifications,module.exports.getPublicApi=getPublicApi;