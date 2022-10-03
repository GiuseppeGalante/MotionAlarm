const {Telegraf} = require('telegraf');
var amqp = require('amqplib');
var sql = require("mssql");
const crypto = require('crypto')
require("dotenv").config({ path: ".env" });

var id="";
var password="";
var first_password="";
var c_password="";
var new_password="";
var name_contact="";
var error_id=true;
var alarm=0;
const bot = new Telegraf(`${process.env.BOT_TOKEN}`);


var dbConfig = {
 server: `${process.env.SERVER}`,
 database: `${process.env.DATABASE}`,
 user: `${process.env.USER_DATABASE}`,
 password: `${process.env.PASSWORD_DATABASE}`,
 port: 1433,
 options: {
       encrypt: true
   }
};


var id_user;
bot.start((ctx) => 
    {
        id_user=ctx.chat.id;
        ctx.reply("Welcome, if you want control the movement in your home set the identifier of device with /id.");
        log("Bot started.");
        ctx.reply("For a list of commands, type /help");
    }
)

bot.command('off', (ctx) => {
    if(alarm==1)
    {
       alarm=0;
       bot.telegram.sendMessage(id_user,"Alarm deactivated"); 
       alert();
    }
    else
    {
      bot.telegram.sendMessage(id_user,"Alarm already deactivated"); 
    }
    
})
bot.command('on', (ctx) => {
    if(alarm==0)
    {
       alarm=1;
       bot.telegram.sendMessage(id_user,"Alarm activated"); 
       alert();
    }
    else
    {
      bot.telegram.sendMessage(id_user,"Alarm already activated"); 
    }
})  
  
  
bot.command('help', (ctx) => {
      log("Help displayed");
      bot.telegram.sendMessage(id_user, "/id: set the device id\n/on: activates the alarm\n/off: deactivates the alarm\n/mp: modify the password\n/ac: add a contact\n/rc: remove a contact\n/vc: view all contact");
  }) 

bot.command('id', (ctx) => {
    ctx.deleteMessage();
    const options = {
       reply_markup: {
              
              force_reply:true,
            },
            
          }
        bot.telegram.sendMessage(id_user, "Provide the id of device", options);
})
  
bot.command('mp', (ctx) => {
    ctx.deleteMessage();
    const options = {
       reply_markup: {
              
              force_reply:true,
            },
            
          }
        bot.telegram.sendMessage(id_user, "Provide the old password", options);
}) 
  
bot.command('ac', (ctx) => {

    const options = {
       reply_markup: {
              
              force_reply:true,
            },
            
          }
        bot.telegram.sendMessage(id_user, "Provide the password for add a contact", options);
  
    
})

bot.command('rc', (ctx) => {
   
    const options = {
       reply_markup: {
              
              force_reply:true,
            },
            
          }
        bot.telegram.sendMessage(id_user, "Provide the password for remove a contact", options); 
    
})
bot.command('vc', (ctx) => {

    const options = {
       reply_markup: {
              
              force_reply:true,
            },
            
          }
        bot.telegram.sendMessage(id_user, "Provide the password for view the contacts", options);
    
})

bot.action('report', (ctx)=>{
        log("Report the intrusion");
        ctx.deleteMessage();
       const options = {
       reply_markup: {
              
              force_reply:true,
            },
            
          }
        bot.telegram.sendMessage(id_user, "Insert the password for report", options);
        
        
})

bot.action('not', (ctx)=>{
        
        log("No reporting");

        ctx.deleteMessage();
})

bot.on("message", (ctx) => {
   
	const options = {
		reply_markup: {
			force_reply:true,
		},
	}
	const message = ctx.message;
	if(message.reply_to_message!=undefined)
	{
		if(message.reply_to_message.text=="Provide the id of device") //start set ID
		{
		       
			var text=(message.text.toUpperCase()).split('');
			var msg=message.text.toUpperCase();
			var ok=true;
			if(text.length==20)
			{
				var conn = new sql.ConnectionPool(dbConfig);
				conn.connect()
				.then(function () {
					var req = new sql.Request(conn);
						req.query("SELECT Id_device,SecretCode FROM [dbo].[motion_alarm]")
						.then(function (recordset) {
							for(i=0;i<recordset["rowsAffected"]*1;i++)
							{
								if(recordset["recordset"][i]["Id_device"].includes(msg))
								{
									id=msg;
									error_id=false;
									bot.telegram.sendMessage(id_user,"Device Id setted");
									log("Device Id setted.");
									if(recordset["recordset"][i]["SecretCode"].includes("35675e68f4b5af7b995d9205ad0fc43842f16450"))
									{
										const options = {
											reply_markup: {
												force_reply:true,
											},
										}
										bot.telegram.sendMessage(id_user,"First Access, Choose a password",options);
									}
								}else
								{
									bot.telegram.sendMessage(id_user,"Id Not Valid");
									log("Device Id Not Valid.");
									bot.telegram.sendMessage(id_user, "Provide the id of device", options);  
									error_id=true;
								}
							}
							conn.close();
						})
						.catch(function (err) {
							console.log(err);
							conn.close();
						})
				})
				.catch(function (err) {
					console.log(err);
					conn.close();
				});
			}else
			{
				bot.telegram.sendMessage(id_user,"Id Not Valid");
				log("Device Id Not Valid.");
				bot.telegram.sendMessage(id_user, "Provide the id of device", options);  
				error_id=true;
			}
		} //end set Id
		else if(message.reply_to_message.text=="First Access, Choose a password") //start First Access
		{
			first_password=message.text;
			const options = {
				reply_markup: {
              
				force_reply:true,
				},
			}
			bot.telegram.sendMessage(id_user,"Re-enter the password",options);
		} else if(message.reply_to_message.text=="Re-enter the password")
		{
			c_password=message.text;
			if(first_password==c_password)
			{
				var conn = new sql.ConnectionPool(dbConfig);
				conn.connect()
				.then(function () {
					var req = new sql.Request(conn);
					password=crypto.createHash('sha1').update(first_password).digest('hex');
					req.input("password",sql.VarChar,password);
					req.input("id",sql.VarChar,id);
					req.query("UPDATE [dbo].[motion_alarm] SET SecretCode=@password WHERE Id_device=@id")
					.then(function (recordset) {
						if(recordset["rowsAffected"]*1==1)
						{
							bot.telegram.sendMessage(id_user,"Passwords modified");
						}
						else
						{
							bot.telegram.sendMessage(id_user,"An error has occurred");
							const options = {
								reply_markup: {
									force_reply:true,
								},
							}
							bot.telegram.sendMessage(id_user,"First Access, Choose a password",options);
            
						}
						conn.close();
					})
					.catch(function (err) {
						console.log(err);
						conn.close();
					})
				})
				.catch(function (err) {
					console.log(err);
					conn.close();
				});
			}else
			{
				const options = {
				reply_markup: {
					force_reply:true,
					},
				}
				bot.telegram.sendMessage(id_user,"Passwords do not match");
				bot.telegram.sendMessage(id_user,"First Access, Choose a password",options); 
			}
		} //end first access
		else if(message.reply_to_message.text=="Provide the old password")    //start modify password
		{
			var password=message.text;
			if(id=="")
			{
				bot.telegram.sendMessage(id_user, "Id not setted");
				bot.telegram.sendMessage(id_user,"Provide the id of device",options);
			}else
			{
				var conn = new sql.ConnectionPool(dbConfig);
				conn.connect()
				.then(function () {
					var req = new sql.Request(conn);
					password=crypto.createHash('sha1').update(password).digest('hex');
					req.input("id",sql.VarChar,id);
					req.query("SELECT SecretCode FROM [dbo].[motion_alarm] WHERE Id_device=@id")
					.then(function (recordset) {
						if(recordset["recordset"][0]["SecretCode"]===password)
						{
							const options = {
								reply_markup: {
									force_reply:true,
								},
							}
							bot.telegram.sendMessage(id_user,"Choose a new password",options);
						}
						else
						{
							bot.telegram.sendMessage(id_user,"Old Password not valid");
							const options = {
								reply_markup: {
									force_reply:true,
								},
            
							}
							bot.telegram.sendMessage(id_user,"Provide the old password",options);
						}
						conn.close();
					})
					.catch(function (err) {
						console.log(err);
						conn.close();
					})
				})
				.catch(function (err) {
					console.log(err);
					conn.close();
				});
			}
		}
		else if(message.reply_to_message.text=="Choose a new password") 
		{
			new_password=message.text;
			const options = {
				reply_markup: {
				force_reply:true,
				},
			}
			bot.telegram.sendMessage(id_user,"Re-enter the new password",options);  
		}
		else if(message.reply_to_message.text=="Re-enter the new password")
		{
			c_password=message.text;
			if(new_password==c_password)
			{
				var conn = new sql.ConnectionPool(dbConfig);
				conn.connect()
				.then(function () {
					var req = new sql.Request(conn);
					new_password=crypto.createHash('sha1').update(new_password).digest('hex');
					req.input("password",sql.VarChar,new_password);
					req.input("id",sql.VarChar,id);
					req.query("UPDATE [dbo].[motion_alarm] SET SecretCode=@password WHERE Id_device=@id")
					.then(function (recordset) {
						if(recordset["rowsAffected"]*1==1)
						{
							log("Password modified");
							bot.telegram.sendMessage(id_user,"Passwords modified");
						}
						else
						{
							bot.telegram.sendMessage(id_user,"An error has occurred");
							const options = {
									reply_markup: {
									force_reply:true,
									},
            
							}
							bot.telegram.sendMessage(id_user,"Choose a new password",options);
						}
						conn.close();
					})
					.catch(function (err) {
						console.log(err);
						conn.close();
					})

				})
				.catch(function (err) {
					console.log(err);
					conn.close();
				});
			}else
			{
				const options = {
					reply_markup: {
					force_reply:true,
					},
				}
				bot.telegram.sendMessage(id_user,"Passwords do not match");
				bot.telegram.sendMessage(id_user,"Choose a new password",options);  
			}
		}  //end modify password
		else if(message.reply_to_message.text=="Provide the password for view the contacts")  //start view contacts
		{
			var password=message.text;
			if(id=="")
			{
				bot.telegram.sendMessage(id_user, "Id not setted");
				bot.telegram.sendMessage(id_user,"Provide the id of device",options);
			}else
			{
				var conn = new sql.ConnectionPool(dbConfig);
				conn.connect()
				.then(function () {
					var req = new sql.Request(conn);
					password=crypto.createHash('sha1').update(password).digest('hex');
					req.input("id",sql.VarChar,id);
					req.query("SELECT SecretCode FROM [dbo].[motion_alarm] WHERE Id_device=@id")
					.then(function (recordset) {
						if(recordset["recordset"][0]["SecretCode"]===password)
						{
							var conn_1 = new sql.ConnectionPool(dbConfig);
							conn_1.connect()
							.then(function () {
								var req_1 = new sql.Request(conn_1);
								req_1.input("id",sql.VarChar,id);
								req_1.query("SELECT Name,Telephone FROM [dbo].[security_contact] WHERE Id_device=@id")
								.then(function (record) {
									if(record["recordset"].length === 0)
									{
										bot.telegram.sendMessage(id_user,"No contact. Add one with\n/ac");
									}
									else
									{
										var send="Security Contact:\n";
										for(i=0;i<record["rowsAffected"]*1;i++)
										{
											send=send+(i+1)+". "+record["recordset"][i]["Name"]+"\n";
										}
										bot.telegram.sendMessage(id_user,send);
									}
									conn_1.close();
								})
								.catch(function (err) {
									console.log(err);
									conn_1.close();
								})
							})
							.catch(function (err) {
								console.log(err);
								conn_1.close();
							});
						}
						else
						{
							bot.telegram.sendMessage(id_user,"Password not valid");
							const options = {
								reply_markup: {
									force_reply:true,
								},
							}
							bot.telegram.sendMessage(id_user,"Provide the password for view the contacts",options);
						}
						conn.close();
					})
					.catch(function (err) {
						console.log(err);
						conn.close();
					})
				})
				.catch(function (err) {
					console.log(err);
					conn.close();
					});
			}
		} //end view contacts
		else if(message.reply_to_message.text=="Provide the password for add a contact")  //start add contact
		{
			var password=message.text;
			if(id=="")
			{
				bot.telegram.sendMessage(id_user, "Id not setted");
				bot.telegram.sendMessage(id_user,"Provide the id of device",options);
			}else
			{
				var conn = new sql.ConnectionPool(dbConfig);
				conn.connect()
				.then(function () {
					var req = new sql.Request(conn);
					password=crypto.createHash('sha1').update(password).digest('hex');
					req.input("id",sql.VarChar,id);
					req.query("SELECT SecretCode FROM [dbo].[motion_alarm] WHERE Id_device=@id")
					.then(function (recordset) {
						if(recordset["recordset"][0]["SecretCode"]===password)
						{
							const options = {
								reply_markup: {
									force_reply:true,
								},
							}
							bot.telegram.sendMessage(id_user,"Provide the name of contact",options);
						}
						else
						{
							bot.telegram.sendMessage(id_user,"Password not valid");
							const options = {
								reply_markup: {
									force_reply:true,
								},
							}
							bot.telegram.sendMessage(id_user,"Provide the password for view the contacts",options);
						}       
						conn.close();
					})
					.catch(function (err) {
						console.log(err);
						conn.close();
					})

				})
				.catch(function (err) {
					console.log(err);
					conn.close();
				});
			}
		}else if(message.reply_to_message.text=="Provide the name of contact")
		{
			name_contact=message.text;
			const options = {
				reply_markup: {
				force_reply:true,
				},
			}
			bot.telegram.sendMessage(id_user,"Provide the number of contact",options);
		}
		else if(message.reply_to_message.text=="Provide the number of contact")
		{
			var number_contact=message.text;
			var conn = new sql.ConnectionPool(dbConfig);
			conn.connect()
			.then(function () {
				var req = new sql.Request(conn);
				req.input("id",sql.VarChar,id);
				req.input("name",sql.VarChar,name_contact);
				req.input("number",sql.VarChar,number_contact);
				req.query("INSERT INTO [dbo].[security_contact](Name,Telephone,Id_device) VALUES(@name,@number,@id)")
				.then(function (recordset) {
					if(recordset["rowsAffected"]*1==1)
					{
						log("Contact Add");
						bot.telegram.sendMessage(id_user,"Contact add");
						name_contact="";
					}
					else
					{
						bot.telegram.sendMessage(id_user,"An error has occurred");
						const options = {
							reply_markup: {
								force_reply:true,
							},
						}
						bot.telegram.sendMessage(id_user,"Provide the number of contact",options);          
					}
					conn.close();
				})
				.catch(function (err) {
					console.log(err);
					conn.close();
				})
			})
			.catch(function (err) {
				console.log(err);
				conn.close();
			});     
		}// end add contact
		else if(message.reply_to_message.text=="Provide the password for remove a contact") //start remove contact
		{
			var password=message.text;
			if(id=="")
			{
				bot.telegram.sendMessage(id_user, "Id not setted");
				bot.telegram.sendMessage(id_user,"Provide the id of device",options);
			}else
			{
				var conn = new sql.ConnectionPool(dbConfig);
				conn.connect()
				.then(function () {
					var req = new sql.Request(conn);
					password=crypto.createHash('sha1').update(password).digest('hex');
					req.input("id",sql.VarChar,id);
					req.query("SELECT SecretCode FROM [dbo].[motion_alarm] WHERE Id_device=@id")
					.then(function (recordset) {
						if(recordset["recordset"][0]["SecretCode"]===password)
						{
							var conn_1 = new sql.ConnectionPool(dbConfig);
							conn_1.connect()
							.then(function () {
								var req_1 = new sql.Request(conn_1);
								req_1.input("id",sql.VarChar,id);
								req_1.query("SELECT Name,Telephone FROM [dbo].[security_contact] WHERE Id_device=@id")
								.then(function (record) {
									if(record["recordset"].length === 0)
									{
										bot.telegram.sendMessage(id_user,"No contact. Add one with\n/ac");
									}
									else
									{
										for(i=0;i<record["rowsAffected"]*1;i++)
										{
											bot.telegram.sendMessage(id_user,(i+1)+". "+record["recordset"][i]["Name"]);
										}
									}
									conn_1.close();
								})
								.catch(function (err) {
									console.log(err);
									conn_1.close();
								})
							})
							.catch(function (err) {
								console.log(err);
								conn_1.close();
							});
							const options = {
								reply_markup: {
									force_reply:true,
								},
							}
							bot.telegram.sendMessage(id_user,"Provide the code of contact to remove",options);
						}
						else
						{
							bot.telegram.sendMessage(id_user,"Password not valid");
							const options = {
								reply_markup: {
									force_reply:true,
								},
							}
							bot.telegram.sendMessage(id_user,"Provide the password for view the contacts",options);
						}   
						conn.close();
					})
					.catch(function (err) {
						console.log(err);
						conn.close();
					})
				})
				.catch(function (err) {
					console.log(err);
					conn.close();
				});
			}    
		}
		else if(message.reply_to_message.text=="Provide the code of contact to remove")
		{
			var id_delete=message.text*1;
			var conn = new sql.ConnectionPool(dbConfig);
			conn.connect()
			.then(function () {
				var req = new sql.Request(conn);
				req.input("id",sql.VarChar,id);
				req.query("SELECT Id,Name,Telephone FROM [dbo].[security_contact] WHERE Id_device=@id")
				.then(function (record) {
					if(record["recordset"].length === 0)
					{
						bot.telegram.sendMessage(id_user,"No contact. Add one with\n/ac");
					}
					else
					{
						if(id_delete>0 && id_delete<=record["recordset"].length)
						{
							var conn_1 = new sql.ConnectionPool(dbConfig);
							conn_1.connect()
							.then(function () {
								var req_1 = new sql.Request(conn_1);
								req_1.input("id",sql.Int,record["recordset"][id_delete-1]["Id"]);
								req_1.query("DELETE FROM [dbo].[security_contact] WHERE Id=@id")
								.then(function (record) {
									if(record["rowsAffected"]*1==1)
									{     
										log("Contact delete");
										bot.telegram.sendMessage(id_user,"Contact delete");
									}
									else
									{
										const options = {
											reply_markup: {
												force_reply:true,
											},
										}
										bot.telegram.sendMessage(id_user,"Error with delete of contact");
										bot.telegram.sendMessage(id_user,"Provide the code of contact to remove",options);  
									}
									conn_1.close();
								})
								.catch(function (err) {
									console.log(err);
									conn_1.close();
								})
							})
							.catch(function (err) {
								console.log(err);
								conn_1.close();
							});  
						}else
						{
							const options = {
								reply_markup: {
								force_reply:true,
								},
							}
							bot.telegram.sendMessage(id_user,"Invalid code");
							bot.telegram.sendMessage(id_user,"Provide the code of contact to remove",options);
						}
					} 
					conn.close();
				})
				.catch(function (err) {
					console.log(err);
					conn.close();
				})
			})
			.catch(function (err) {
				console.log(err);
				conn.close();
			});
		} //end remove contact
		else if(message.reply_to_message.text=="Insert the password for report") //start the report
		{
			var password_report=message.text;
			if(id=="")
			{
				bot.telegram.sendMessage(id_user, "Id not setted");
				bot.telegram.sendMessage(id_user,"Provide the id of device",options);
			}else
			{
				var conn = new sql.ConnectionPool(dbConfig);
				conn.connect()
				.then(function () {
					var req = new sql.Request(conn);
					password_report=crypto.createHash('sha1').update(password_report).digest('hex');
					req.input("id",sql.VarChar,id);
					req.query("SELECT SecretCode FROM [dbo].[motion_alarm] WHERE Id_device=@id")
					.then(function (recordset) {
						if(recordset["recordset"][0]["SecretCode"]===password_report)
						{
							log("Valid Password for report");
							alarm=1;
							alert();
							bot.telegram.sendMessage(id_user, "🚨 Alarm Actived\nValid Password");
							var conn_1 = new sql.ConnectionPool(dbConfig);
							conn_1.connect()
							.then(function () {
								var req_1 = new sql.Request(conn_1);
								req_1.input("id",sql.VarChar,id);
								req_1.query("SELECT Name,Telephone FROM [dbo].[security_contact] WHERE Id_device=@id")
								.then(function (record) {
									if(record["recordset"].length === 0)
									{
										bot.telegram.sendMessage(id_user,"No contact. Add one with\n/ac");
									}
									else
									{
										var send="Security Contact:\n";
										for(i=0;i<record["rowsAffected"]*1;i++)
										{
											send=send+(i+1)+". "+record["recordset"][i]["Name"]+"\n";
										}
										bot.telegram.sendMessage(id_user,send);
										const reply = {
											reply_markup: {
												force_reply:true,
											},
										}
										bot.telegram.sendMessage(id_user, "Send the value of the security contact:",reply);
									}
									conn_1.close();
								})
								.catch(function (err) {
									console.log(err);
									conn_1.close();
								})
							})
							.catch(function (err) {
								console.log(err);
								conn_1.close();
							});
						}
						else
						{
							bot.telegram.sendMessage(id_user,"Password not valid");
							const options = {
								reply_markup: {
									force_reply:true,
								},
							}
							bot.telegram.sendMessage(id_user,"Insert the password for report",options);
						}
						conn.close();
					})
					.catch(function (err) {
						console.log(err);
						conn.close();
					})
				})
				.catch(function (err) {
					console.log(err);
					conn.close();
				});
			}
		}
		else if(message.reply_to_message.text=="Send the value of the security contact:")
		{
			var id_contact=message.text*1;
			var conn = new sql.ConnectionPool(dbConfig);
			conn.connect()
			.then(function () {
				var req = new sql.Request(conn);
				req.input("id",sql.VarChar,id);
				req.query("SELECT Id,Telephone FROM [dbo].[security_contact] WHERE Id_device=@id")
				.then(function (record) {
					if(id_contact>0 && id_contact<=record["recordset"].length)
					{
						bot.telegram.sendMessage(id_user,"Send alarm to "+record["recordset"][id_contact-1]["Telephone"]);
					}else
					{
						const options = {
							reply_markup: {
								force_reply:true,
							},
						}
						bot.telegram.sendMessage(id_user,"Invalid code");
						bot.telegram.sendMessage(id_user,"Send the value of the security contact:",options);
					}
					conn.close();
				})
				.catch(function (err) {
					console.log(err);
					conn.close();
				})
			})
			.catch(function (err) {
				console.log(err);
				conn.close();
			});
		}  
	} 
});



amqp.connect(`amqp://guest:guest@${process.env.IP}`).then(function(conn) {
	process.once('SIGINT', function() { conn.close(); });
	return conn.createChannel().then(function(ch) {	
		var chaq = ch.assertQueue('iot/sensors/answare', {durable: false});
		chaq = chaq.then(function(_qok) {
			return ch.consume('iot/sensors/answare', function(msg) {
				if(msg.content.toString()=="1")
				{
					const options = {
						reply_markup: {
							inline_keyboard: 
							[
								[
									{
										text: "Report the intrusion",
										callback_data: 'report',
									},
									{
										text: "Do nothing",
										callback_data: 'not',
									},
								],
							],
						}, 
					}
					bot.telegram.sendMessage(id_user, "🚨 Motion Detected\nHow do you want to proceed?", options);
				}
			}, {noAck: true});
		});
	});
}).catch(console.warn);

function alert()
{
	var q_alarm = 'iot/sensors/alarm'
	var q_log='iot/logs'
	amqp.connect(`amqp://guest:guest@${process.env.IP}`).then(function(conn) {
		return conn.createChannel().then(function(ch) {
			var chaq = ch.assertQueue(q_alarm, {durable: false});
			return chaq.then(function(_qok) {
				if(alarm == 0)
				{
					ch.sendToQueue(q_alarm,Buffer.from("Alarm deactivated"));
					ch.sendToQueue(q_log,Buffer.from("Alarm deactivated"));
				}
				else
				{
					ch.sendToQueue(q_alarm,Buffer.from("Alarm activated"));
					ch.sendToQueue(q_log,Buffer.from("Alarm activated"));
				}
				return ch.close();
			});   
		});
    }).catch(console.warn);
}

function log(msg)
{
	var q_log='iot/logs'
    amqp.connect(`amqp://guest:guest@${process.env.IP}`).then(function(conn) {
		return conn.createChannel().then(function(ch) {
			var chaq = ch.assertQueue(q_log, {durable: false});
			return chaq.then(function(_qok) {
				ch.sendToQueue(q_log,Buffer.from(msg));
				return ch.close();
			});   
		});
    }).catch(console.warn);
}
bot.launch()



  
  
  
  
