CREATE TABLE motion_alarm (
  Id_device varchar(20) NOT NULL PRIMARY KEY,
  SecretCode varchar(40) NOT NULL,
)

INSERT INTO Motion_Alarm (Id_device, SecretCode) VALUES
('ABCDEFGHIL0123456789', '35675e68f4b5af7b995d9205ad0fc43842f16450');