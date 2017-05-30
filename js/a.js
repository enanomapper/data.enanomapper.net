function AmbitUser(ambiturl,successfunc, errorfunc) {
	this.username = null;
	this.useruri = null
	this.firstname = null;
	this.lastname = null;
	this.error = errorfunc;
	this.success = successfunc;
	this.ambiturl = ambiturl;
	
	var self = this;
	
	$.ajax({
		url : this.ambiturl + "myaccount?media=application/json",
		dataType : 'json',
		success : function(data) {
			self.username = data.user[0].username;
			self.firstname = data.user[0].firstname;
			self.lastname = data.user[0].lastname;
			self.useruri = data.user[0].uri;
			if (self.success != undefined) {
				self.success(data);
			}
		},
		error : function(jqxhr, textStatus, e) {
			if (self.error != undefined) self.error(jqxhr,textStatus,e);
		}
	});
	this.myaccountAction = function(targeturi) {
		return this.ambiturl + "myaccount";
	}
	this.deleteAction = function(targeturi) {
		return this.ambiturl + "provider/signout?method=DELETE&targetUri="+encodeURIComponent(targeturi);
	}	
}