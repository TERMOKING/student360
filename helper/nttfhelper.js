var db = require("../config/connection");
var objectId = require("mongodb").ObjectId;
const bcrypt = require("bcryptjs");
var XLSX = require("xlsx");

module.exports = {

  //signup or login///////////////////////////////////////////////////////
  // doLogin: (userData) => {
  //   return new Promise(async (resolve, reject) => {
  //     var response = {};

  //     var user = await db.nttfDb().collection("staff").findOne({ email: userData.email });
  //     if(user)
  //     {
  //       if (user.password) {
  //         bcrypt.compare(userData.password, user.password).then((status) => {
  //           if (status) {
  //             response.status = true;
  //             response.user = user;
  //             saveLoginInfo(user)
  //             resolve(response);
  //           } else {
  //             resolve({ status: false });
  //           }
  //         });
  //       } else {
  //         resolve({ status: false });
  //       }
  //     }

  //     user= await db.nttfDb().collection('superadmin').findOne({email:userData.email})
  //     if(user)
  //     {
  //       if (user.password) {
  //         bcrypt.compare(userData.password, user.password).then((status) => {
  //           if (status) {
  //             response.status = true;
  //             response.user = user;
  //             saveLoginInfo(user)
  //             resolve(response);
  //           } else {
  //             resolve({ status: false });
  //           }
  //         });
  //       } else {
  //         resolve({ status: false });
  //       }
  //     }
  //     user= await db.nttfDb().collection('trainees').findOne({email:userData.email})
  //     if(user)
  //     {
  //       if (user.password) {
  //         bcrypt.compare(userData.password, user.password).then((status) => {
  //           if (status) {
  //             response.status = true;
  //             response.user = user;
  //             saveLoginInfo(user)
  //             resolve(response);
  //           } else {
  //             resolve({ status: false });
  //           }
  //         });
  //       } else {
  //         resolve({ status: false });
  //       }
  //     }
  //      else {
  //       resolve({status:false})
  //     }
  //   });
  // },

  // doSignup: (userData) => {
  //   return new Promise(async (resolve, reject) => {
  //     userData.password = await bcrypt.hash(userData.password, 10);

  //     var response = {};

  //     db.nttfDb()
  //       .collection("admin")
  //       .insertOne(userData)
  //       .then((data) => {
  //         resolve(data);
  //       });
  //   });
  // },


  doLogin:(loginData)=>{

    loginData.id = loginData.id.toLowerCase()
    return new Promise(async(resolve,reject)=>{
      var response={}
      var login = await db.nttfDb().collection("userlogin").findOne({ id: loginData.id });
      if(login)
      {
        bcrypt.compare(loginData.password, login.password).then(async(status)=>{
          if (status) {
            response.status = true;
            var user={}
  
            if(login.staff)
            {
              var staff=await db.nttfDb().collection("staff").findOne({staffid:login.id})
              user={
                firstname:staff.firstname,
                lastname:staff.lastname,
                staffid:staff.staffid,
                course:staff.course,
                year:staff.year,
                staff:true,
              }
            }
            else if(login.admin)
            {
              user={
                adminid:login.id,
                admin:true,
                firstname:login.id
              }
            }
            else
            {
              user=await db.nttfDb().collection('trainees').findOne({tokennumber:login.id})
            }
            
            response.user = user
            resolve(response)
            saveLoginInfo(user)

          } else {
            resolve({ status: false });
          }
        })
        }
        else
        {
          resolve ({status:false})
        }
      })
    },
    
    changePassword:(password,id)=>{
      var currentpassword=password.currentpassword
      var newpassword=password.newpassword
      var confirmpassword=password.confirmpassword

      return new Promise(async(resolve,reject)=>{
        var login=await db.nttfDb().collection('userlogin').findOne({id:id})

        bcrypt.compare(currentpassword,login.password).then(async(status)=>{
          if(status)
          {
            if(newpassword===confirmpassword)
            {
              var password=await bcrypt.hash(newpassword,10)
              console.log(password);
              db.nttfDb().collection('userlogin').updateOne({id:id},
              {
                $set:{
                  password:password
                }
              })
                resolve({passwordChange:true})
            }
            else
            {
              resolve({confirmPasswordError:true})
            }
          }
          else
          {
            resolve({currentPasswordError:true})
          }

        })

      })

    },


  //trainee collection/////////////////////////////////////////////////////////////

  addTrainee: (trainee) => {
    return new Promise(async(resolve, reject) => {
      
      var existProfile = await db.nttfDb().collection('userlogin').findOne({id:trainee.tokennumber})
      
      if(existProfile){
        resolve({validationFalse:true})
      }
      

      for(var i=0;i<trainee.length;i++)
      {
        trainee[i].aadharnumber = trainee[i].aadharnumber.toString()
        trainee[i].phonenumber = trainee[i].phonenumber.toString()
        trainee[i].alternativenumber = trainee[i].alternativenumber.toString()
        trainee[i].mothersphonenumber = trainee[i].mothersphonenumber.toString()
        trainee[i].fathersphonenumber = trainee[i].fathersphonenumber.toString()
      }

      trainee.dob =dateOnly(new Date(trainee.dob))
      trainee.year=parseInt(trainee.year)
      trainee.mentorstatus='normal'

      db.nttfDb().collection("trainees").insertOne(trainee);

        var password=await bcrypt.hash(trainee.dob, 10);

      var logininfo={
        id:trainee.tokennumber,
        password:password
      }

      db.nttfDb().collection('userlogin').insertOne(logininfo)
      resolve({validationFalse:false})
    });
  },
  viewTrainee: (traineeId) => {
    return new Promise((resolve, reject) => {
      db.nttfDb()
        .collection("trainees")
        .findOne({ tokennumber: traineeId })
        .then(async(trainee) => {
          resolve(trainee);
        });
    });
  },
  viewAllTrainees:()=>{
    return new Promise(async(resolve,reject)=>{
      let trainees=await db.nttfDb().collection("trainees").find().sort({tokennumber:1}).toArray()
      resolve(trainees)
    })
  },
  addBulkTrainees: (trainees) => {
    return new Promise( (resolve, reject) => {
      var sheet_namelist = trainees.SheetNames;
      var x = 0;
      sheet_namelist.forEach(async(element) => {
        var xlData = XLSX.utils.sheet_to_json(trainees.Sheets[sheet_namelist[x]]);
        
        for(var i=0;i<xlData.length;i++)
        {
          // var validTokennumber =await xlData[i].tokennumber
          
          // var validProfile = await db.nttfDb().collection('trainees').findOne({tokennumber:validTokennumber})
          // if(validProfile)
          // {
          //   resolve({validFalse:true,tokennumber:xlData[i].tokennumber})
          // }

          xlData[i].aadharnumber = xlData[i].aadharnumber.toString()
          xlData[i].phonenumber = xlData[i].phonenumber.toString()
          xlData[i].alternativephonenumber = xlData[i].alternativephonenumber.toString()
          xlData[i].mothersphonenumber = xlData[i].mothersphonenumber.toString()
          xlData[i].fathersphonenumber = xlData[i].fathersphonenumber.toString()
        }

        for(var i=0;i<xlData.length;i++)
            {
              var date=xlData[i].dob
              date.setDate(date.getDate()+1)
              date=dateOnly(date);
              xlData[i].dob=date
              var tok=xlData[i].tokennumber        
              xlData[i].tokennumber=tok.toLowerCase()
              xlData[i].mentorstatus='normal'

              var login={
                id:xlData[i].tokennumber,
                password:await bcrypt.hash(date,10)
              }
              db.nttfDb().collection('userlogin').insertOne(login)
            }

            
          await db.nttfDb().collection("trainees").insertMany(xlData, (err, data) => {
            if (err) {
              resolve(err);
            } else {
              resolve({validFalse:true})
            }
          })
        x++
      });
    });
  },
  editTrainee: (trainee,traineeId) => {
    return new Promise((resolve, reject) => {
      trainee.dob=dateOnly(new Date(trainee.dob))
      db.nttfDb().collection("trainees")
      .updateOne({ tokennumber: trainee.tokennumber },
          {
            $set: {
              firstname: trainee.firstname,
              lastname: trainee.lastname,
              email: trainee.email,
              dob: trainee.dob,
              gender: trainee.gender,
              course: trainee.course,
              year:parseInt(trainee.year),
              category: trainee.category,
              quota: trainee.quota,
              tokennumber: trainee.tokennumber,
              aadharnumber: trainee.aadharnumber,
              phonenumber: trainee.phonenumber,
              alternativephonenumber: trainee.alternativephonenumber,
              fathersname: trainee.fathersname,
              fathersphonenumber: trainee.fathersphonenumber,
              mothersname: trainee.mothersname,
              mothersphonenumber: trainee.mothersphonenumber,
              permanentaddress: trainee.permanentaddress,
            },
          }
        )
        .then(() => {
          resolve()
        })
    })
  },
  getTraineeByCourseId: (course, year) => {
    year=parseInt(year)
    return new Promise(async (resolve, reject) => {
      let trainees = await db.nttfDb().collection("trainees")
      .find({ $and: [{ course: course }, { year: year }] })
      .sort({tokennumber:1}).toArray();
      resolve(trainees);
    });
  },
  getTraineeByCategoryId: (category) => {
    return new Promise(async (resolve, reject) => {
      let trainees = await db
        .nttfDb()
        .collection("trainees")
        .find({ category: category })
        .sort({tokennumber:1})
        .toArray();
      resolve(trainees);
    });
  },

  removeTrainee:(tokennumber)=>{
    return new Promise(async(resolve,reject)=>{
      db.nttfDb().collection('trainees').deleteOne({tokennumber:tokennumber})
      db.nttfDb().collection('userlogin').deleteOne({id:tokennumber})
      resolve()
    })
  },

//staff collection//////////////////////////////////////////////////////////////////

  addStaff: (staff) => {
    var staffId=staff.staffid
    staff.staffid=staffId.toLowerCase()
    console.log(staff);
    return new Promise(async(resolve, reject) => {

      var validProfile = await db.nttfDb().collection('userlogin').findOne({id:staff.staffid})
      if(validProfile)
      {
        resolve({validError:true})
      }
      else
      {
      db.nttfDb().collection("staff").insertOne(staff);

      var password=await bcrypt.hash(staff.phonenumber,10)
      var logininfo
      
        logininfo={
          id:staff.staffid,
          password:password,
          staff:true
        }
      

      db.nttfDb().collection('userlogin').insertOne(logininfo)
      resolve({validErr:false});
      }
    });
  },

  editStaff:(staffid,staff)=>{
    return new Promise((resolve,reject)=>{
      db.nttfDb().collection('staff').updateOne({staffid:staffid},{
        $set:{
          staffid:staff.staffid,
          firstname:staff.firstname,
          lastname:staff.lastname,
          email:staff.email,
          nttfemail:staff.nttfemail,
          phonenumber:staff.phonenumber,
          alternativenumber:staff.alternativenumber
        }
      })
      resolve()
    })
  },

  removeStaff:(staffid)=>{
    return new Promise((resolve,reject)=>{
      db.nttfDb().collection('staff').deleteOne({staffid:staffid})
      db.nttfDb().collection('userlogin').deleteOne({id:staffid})
      resolve()
    })
  },

  getAllStaff: () => {
    return new Promise(async (resolve, reject) => {
      let staff = await db.nttfDb().collection("staff").find().sort({staffid:1}).toArray();
      resolve(staff);
    });
  },
  getStaff: (staffId) => {
    return new Promise(async (resolve, reject) => {
      db.nttfDb()
        .collection("staff")
        .findOne({ staffid: staffId })
        .then((data) => {
          resolve(data);
        });
    });
  },

 
  // editRole: (staff) => {
  //   var staffId = staff.staffid;

  //   return new Promise(async (resolve, reject) => {
  //     var user = await db.nttfDb().collection("staff").findOne({ staffid: staffId });

  //     if (user.admin || user.staff)
  //      {
  //       if (staff.role === "admin") 
  //       {
  //         db.nttfDb().collection("staff").updateOne({ staffid: staffId },
  //             {
  //               $set: {
  //                 admin: true,
  //                 center: staff.center,
  //                 course: staff.course,
  //                 batch:staff.batch,
  //                 center:staff.center,
  //                 year:staff.year
  //               },
  //               $unset: {
  //                 staff: true
  //               },
  //             }
  //           );
  //         resolve();
  //       }
  //        else if (staff.role === "staff") 
  //        {
  //         await db.nttfDb().collection("staff").updateOne({ staffid: staffId },
  //             {
  //               $set: {
  //                 staff: true,
  //                 center: staff.center,
  //                 course: staff.course,
  //                 batch:staff.batch,
  //                 center:staff.center,
  //                 year:staff.year
  //               },
  //               $unset: {
  //                 admin: true,
  //               },
  //             });
  //         resolve();
  //       } 
  //       else 
  //       {
  //         await db.nttfDb().collection("staff").updateOne({ staffid: staffId },
  //             {
  //               $set: {
  //                   center: staff.center,
  //                   course: staff.course,
  //               },
  //               $unset: {
  //                 admin: true,
  //                 staff: true,
  //                 password: true,
  //                 year:true,
  //                 batch:true,
  //               },
  //             }
  //           );
  //         resolve();
  //       }
  //     } 
  //     else 
  //     {
  //       if (staff.role === "admin") 
  //       {
  //         db.nttfDb().collection("staff").updateOne({ staffid: staffId },
  //             {
  //               $set: {
  //                 admin: true,
  //                 center: staff.center,
  //                 course: staff.course,
  //                 year:staff.year,
  //                 batch:staff.batch,
  //                 password: await bcrypt.hash(user.phonenumber, 10),
  //               }
  //             }
  //           );
  //         resolve();
  //       } 
  //       else if (staff.role === "staff") 
  //       {
  //         await db.nttfDb().collection("staff").updateOne({ staffid: staffId },
  //             {
  //               $set: {
  //                 staff: true,
  //                 center: staff.center,
  //                 course: staff.course,
  //                 year:staff.year,
  //                 batch:staff.batch,
  //                 password: await bcrypt.hash(user.phonenumber, 10),
  //               }
  //             }
  //           );
  //         resolve();
  //       } 
  //       else 
  //       {
  //         await db.nttfDb().collection("staff").updateOne(
  //             { staffid: staffId },
  //             {
  //               $set: {
  //                 center: staff.center,
  //                 course: staff.course,
  //               },
  //             }
  //           );
  //         resolve();
  //       }
  //     }
  //   });
  // },
  editRole:async(staff)=>{
    
    var staffid=staff.staffid
  
    var year=parseInt(staff.year)
    var course=staff.course
    var staffId=staff.staffid
    var status=true

  
    return new Promise(async (resolve,reject)=>{
  
      var allstaff=await db.nttfDb().collection('staff').find().toArray()
  
      for(var i=0;i<allstaff.length;i++)
      {
        if(allstaff[i].year===year && allstaff[i].course===course)
        {
          resolve({status:false})
          status=false
        }
      }
      if(status)
      {
              db.nttfDb().collection("staff").updateOne({ staffid: staffId },
        {
          $set: {
            staff: true,
            course: course,
            year:year
          }
        })
        
        resolve({status:true})
      }

    })
  },

  removeRole:(staffId)=>{
    return new Promise(async(resolve,reject)=>{

        db.nttfDb().collection('staff').updateOne({staffid:staffId},
          {
            $unset:{
              course:true,
              year:true
            }
          })
          resolve()
    })
  },

//login info collection//////////////////////////////////////////////////



  viewLoginInfo:()=>{
    return new Promise(async(resolve,reject)=>{
      var logins=await db.nttfDb().collection('logins').find().sort({time:-1}).toArray()
      resolve(logins)
    })
  },
  deleteLoginInfo:()=>{
    db.nttfDb().collection('logins').deleteMany()
  }


};

function dateOnly(date) {
  var day = date.getDate()
  var month = date.getMonth()+1
  var year = date.getFullYear()

  return day + "/" + month + "/" + year;
  
}




function saveLoginInfo(user){
  var id
  if(user.admin)
  {
    id=user.adminid
  }
  else if(user.staff)
  {
    id=user.staffid
  }
  else if(user.tokennumber)
  {
    id=user.tokennumber
  }

  var obj={
    id:id,
    time:new Date()
  }

  db.nttfDb().collection('logins').insertOne(obj)

}



// doLogin:(loginData)=>{
//   return new Promise(async(resolve,reject)=>{
//     var response={}
//     var login = await db.nttfDb().collection("userlogin").findOne({ id: loginData.id });
//     if(login)
//     {
//       bcrypt.compare(loginData.password, login.password).then(async(status)=>{
//         if (status) {
//           response.status = true;
//           var user={}

//           if(login.staff)
//           {
//             var staff=await db.nttfDb().collection("staff").find({staffid:login.id})
//             user={
//               firstname:staff.firstname,
//               lastname:staff.lastname,
//               staffid:staff.staffid,
//               course:staff.course,
//               year:staff.year,
//               staff:true,
//             }
//           }
//           else if(login.admin)
//           {
//             user={
//               adminid:login.id,
//               admin:true,
//             }
//           }
//           else
//           {
//             user=await db.nttfDb().collection('trainees').find({tokennumber:login.id})
//           }

//           response.user = user
//           resolve(response)


//           saveLoginInfo(user)
//           resolve(response);
//         } else {
//           resolve({ status: false });
//         }
//       })
//       }
//     })


//   }

async function editrole(staff){
  var staffid=staff.staffid
  var dbstaff=await db.nttfDb().collection('staff').findOne({staffid:staffid})

  var role=staff.role
  var year=parseInt(staff.year)
  var course=staff.course
  var staffId=staff.staffid

  return new Promise(async (resolve,reject)=>{

    var allstaff=await db.nttfDb().collection('staff').find().toArray()

    for(var i=0;i<allstaff.length;i++)
    {
      if(allstaff[i].year===year && allstaff[i].course===course)
      {
        resolve({status:false})
      }
    }

    db.nttfDb().collection("staff").updateOne({ staffid: staffId },
      {
        $set: {
          staff: true,
          course: course,
          year:staff.year
        }
      })
      resolve({status:true})
  })

  
}