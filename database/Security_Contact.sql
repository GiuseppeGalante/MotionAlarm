CREATE TABLE security_contact (
  Id int NOT NULL IDENTITY(1,1) PRIMARY KEY,
  Name varchar(50) NOT NULL,
  Telephone varchar(10) DEFAULT NULL,
  Id_device varchar(20) NOT NULL
)