var express = require('express');
var fs = require("fs");
var router = express.Router();
var nttfHelper= require('../helper/nttfhelper')
var attendanceHelper= require('../helper/attendancehelper')
var dashboardHelper=require('../helper/dashboardhelper')
var courseHelper=require('../helper/courseHelper')
var semesterHelper=require('../helper/semesterHelper')
var mentoringHelper=require('../helper/mentoringHelper')
var nocnHelper=require('../helper/nocnHelper')
var excelConvertHelper = require('../helper/excelConvertHelper')
var db=require('../config/connection')
var XLSX       = require('xlsx');
// var multer     = require('multer')

//multer

// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/uploads')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname)
//   }
// });

// const upload = multer({ storage: storage });


//admin routes

router.get('/',(req,res)=>{


  user=req.session.user
  if(user)
  {
    
      res.redirect('/dashboard')
    
  }
  else
  {
    res.redirect('/login')
  }
  
  
})

router.get('/login',(req,res)=>{
  if(req.session.loggedIn)
  {
    res.redirect('/dashboard')
  }
  else
  {
    res.render('../views/partials/login',{loginErr:req.session.loginErr})
    req.session.loginErr=false
  }
   
})

router.post('/login',(req,res)=>{
    

  nttfHelper.doLogin(req.body).then((response)=>{
    if(response.status)
    {
      req.session.loggedIn=true
      req.session.user=response.user
      user=req.session.user
      res.redirect('/dashboard')
    }
    else
    {
      req.session.loginErr="user id and password doesn't match "
      res.redirect('/login')
    }
  })
})



router.get('/logout',(req,res)=>{
  req.session.destroy()
  
  res.redirect('/')
})




router.get('/dashboard',(req,res)=>{
  user=req.session.user
  if(user.admin)
  {
    dashboardHelper.getCount().then(async(count)=>{
      var course = await dashboardHelper.getCountbyCourse()
      console.log(course);
      res.render('../views/admin/dashboard',{user,count,course})
    })
  }
  else if(user.staff)
  {
    dashboardHelper.getCountbyCourse(user.course,user.year).then((count)=>{
      if(count)
      {
        res.render('../views/staff/dashboard',{user,count})
      }
      else
      {
        res.render('../views/staff/dashboard',{user})
      }
      
    })

  }
  else if(user.tokennumber)
  {
    dashboardHelper.getPresentCountByStudent(user).then((count)=>{
      res.render('students/dashboard',{user,count})
    })
  }
})
  

//admin routes starts here


router.get('/dashboard/viewstaff',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      nttfHelper.getAllStaff().then((staff)=>{
      res.render('../views/admin/view_teachers',{user,staff})
      })
    }
  }
})

router.get('/account',(req,res)=>{
  res.render('admin/admin_profile',{user})
})

router.get('/dashboard/viewtrainees/profile/:id',async(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      user=req.session.user
      let traineeId=req.params.id
      var trainee=await nttfHelper.viewTrainee(traineeId)
      res.render('../views/admin/profile',{trainee,user})
    }
  }
})


router.get('/dashboard/viewtrainees/profile/edittraineeinfo/:id',async(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      var trainee=await nttfHelper.viewTrainee(req.params.id)
      var course= await courseHelper.getAllCourse()
      res.render('admin/edit_traineeinfo',{user,trainee,course})
    }
  }
})
 
router.post('/dashboard/viewtrainees/profile/edittraineeinfo/:id',(req,res)=>{

  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      let traineeId=req.params.id
      nttfHelper.editTrainee(req.body,traineeId).then(()=>{
      })
    }
  }
})

router.get('/dashboard/viewtrainees/profile/removetrainee/:id',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      nttfHelper.removeTrainee(req.params.id).then(()=>{
      })
    }
  }
})

router.get('/dashboard/courselist',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      dashboardHelper.getCountCourseYear().then((course)=>{
        res.render('admin/course_list',{user,course})
      })
    }
  }
})


router.get('/dashboard/attendance',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      courseHelper.getAllCourse().then((course)=>{
        res.render('./admin/course_listattendance',{user,course})
      })
    }
  }
})
router.get('/dashboard/attendance/enter',async(req,res)=>{
  user=req.session.user
  var course=req.query.course
  var year=req.query.year
  if(user)
  {
    if(user.admin)
    {
      var attendanceStatus=await checkEntry(course+year)
      if(attendanceStatus.status)
      {
        nttfHelper.getTraineeByCourseId(course,year).then((trainees)=>{
          res.render('admin/attendance_entry',{user,trainees})
          })
      }
      else
      {
        req.session.attendanceFail=true
        res.render('admin/attendance_entry',{user,status:req.session.attendanceFail})
        req.session.attendanceFail=null
      }
      
    }
  }
})
router.post('/dashboard/attendance/enter',async(req,res)=>{
  user=req.session.user
  var course=req.query.course
  var year=req.query.year
  if(user)
  {
    if(user.admin)
    {
      var trainees=await nttfHelper.getTraineeByCourseId(course,year)
      var students=convertToBoolean(req.body)
      attendanceHelper.addAttendance(students,course,year).then(()=>{
      attendanceHelper.attendancePercentage(course+year)
      res.redirect('/dashboard/attendance')
      })
    }
  }
})



router.post('/dashboard/attendance/viewattendancebymonth',(req,res)=>{
user=req.session.user
if(user)
{
  if(user.admin)
  {
    var course=req.query.course
    var year=parseInt(req.body.year)
    var date=new Date(req.body.date)
    attendanceHelper.getAttendanceByMonth(date,course+year).then((attendance)=>{
      res.render('admin/attendance_view',{user,attendance})
    })
  }
}
})

router.get('/dashboard/nocn',(req,res)=>{
  if(user)
  {
    if(user.admin)
    {
      nocnHelper.getAllModules().then((modules)=>{
        res.render('admin/nocn',{user,modules})
      })
    }
  }
})

router.get('/dashboard/courselist/viewtrainees',(req,res)=>{
  if(user)
  {
    if(user.admin)
    {
      course=req.query.course
      year=parseInt(req.query.year)
      nttfHelper.getTraineeByCourseId(course,year).then((trainees)=>{
      user=req.session.user
      res.render('./admin/view_trainees',{trainees,user})
    })
    }
  }
})

router.get('/dashboard/attendance/viewattendance',(req,res)=>{
  if(user)
  {
    if(user.admin)
    {
      course=req.query.course
      year=parseInt(req.query.year)
      attendanceHelper.getAttendance(course+year).then((attendance)=>{
      res.render('admin/attendance_view',{attendance,user,course,year})
      })
    }
  }
})

// router.get('/attendancetable',(req,res)=>{
//   user=req.session.user
//   if(user)
//   {
//     if(user.admin)
//     {
//       res.render('admin/attendance',{user})
//     }
//   }
// })

// router.post('/dashboard/attendance/trainees',(req,res)=>{
//   user=req.session.user
//   if(user)
//   {
//     if(user.admin)
//     {
//       var course=user.course
//       var year=user.year
//       var attendance=convertToBoolean(req.body)
//       attendanceHelper.addAttendance(attendance,course,year).then(()=>{
//       attendanceHelper.attendancePercentage(course+year)
//       res.redirect('/attendancetable')
//       })
//     }
//   }  
// })

// router.get('/dashboard/attendance/trainees',(req,res)=>{

// })

router.get('/dashboard/mentoring',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      nttfHelper.viewAllTrainees().then((trainees)=>{
      res.render('admin/mentoring_table',{user,trainees})
      })
    }
  }
})

router.get('/dashboard/mentoring/student',(req,res)=>{  
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      nttfHelper.viewTrainee(req.query.id).then(async(trainee)=>{
      var mentor=await mentoringHelper.viewMentor(req.query.id)
      res.render('../views/admin/mentoring_profile',{user,trainee,mentor})
      })
    }
  }
})

router.get('/dashboard/viewstaff/profile/:id',async(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      nttfHelper.getStaff(req.params.id).then((staff)=>{
      res.render('admin/staff_profile',{user,staff})
    })
    }
  }
})

router.get('/dashboard/viewstaff/profile/edit/:id',async(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      var user=await nttfHelper.getStaff(req.params.id).then((staff)=>{
        res.render('admin/edit_staff',{user,staff})
      })
    }
  }
})


router.post('/dashboard/viewstaff/profile/edit/:id',async(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      nttfHelper.editStaff(req.params.id,req.body).then(()=>{
      })
    }
  }
})

// router.post('/dashboard/viewstaff/editprivilege/:id',(req,res)=>{
//   user=req.session.user
//   if(user)
//   {
//     if(user.admin)
//     {
//       staff=req.body
//       staff.staffid=req.params.id
//       staff.year=parseInt(staff.year)
//       nttfHelper.editRole(staff).then((status)=>{
//         if(status.status)
//         {
//           req.session.staffRole="Staff assigned succesfully for course :"+staff.course+" Year :"+staff.year
//         }
//         else
//         {
//           req.session.staffRole="A Staff already has been assigned for course :"+staff.course+" Year :"+staff.year
//         }
//         res.redirect('/dashboard/viewstaff/editprivilege/'+staff.staffid)
      
//       })
//     }
//   }
// })

router.get('/addtrainee',async(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      var course=await courseHelper.getAllCourse()
      res.render('../views/admin/addtrainee',{user,course,validationErr:req.session.validationErr})
      req.session.validationErr = null
    }
  }
  

})


router.post('/addtrainee',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      nttfHelper.addTrainee(req.body).then((status)=>{
        if(status.validationFalse)
        {
          req.session.validationErr = true
          res.redirect('/addtrainee')
        }
      })
    }
  }
})

router.get('/addstaff',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      res.render('../views/admin/addstaff',{user,validErr:req.session.staffValidError})
      req.session.staffValidError = null
    }
  }
  
})

router.post('/addstaff',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      nttfHelper.addStaff(req.body).then((status)=>{
        if(status.validError)
        {
          req.session.staffValidError = true
          res.redirect('/addstaff')
        }
      })
    }
  }
})

router.get('/addbulktrainees',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.admin)
    {
      res.render('../views/admin/addbulktrainees',{user})
    }
  }
    
})

  router.post('/addbulktrainees',async(req,res)=>{
  user=req.session.user

    if(user)
    {
      if(user.admin)
      {
        var excel =  req.files.excel
        await excel.mv('./public/uploads/documents/excel/excel.xlsx')
        
        var trainees=XLSX.readFile('./public/uploads/documents/excel/excel.xlsx',{cellDates:true})

        nttfHelper.addBulkTrainees(trainees).then((status)=>{
          console.log(status)
          res.redirect('/dashboard')

        })
      }
    }
  })

  router.get('/create-staff',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        res.render('../views/admin/create_staff',{user})
      }
    }
   
  })
 
  router.post('/create-staff',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        nttfHelper.addStaff(req.body).then((status)=>{
        res.redirect('/create-staff')
        })
      }
    }
  })


  router.get('/upload_data',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        res.render('../views/admin/upload_data',{user})
      }
    }
  })
  
  router.post('/upload_data',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        if(req.files.aadhar)
        {
          var aadhar=req.files.aadhar
          aadhar.mv('./public/uploads/documents/aadhar/'+req.body.tokennumber+'aadhar.pdf')
        }
        if(req.files.sslc)
        {
          var sslc=req.files.sslc  
          sslc.mv('./public/uploads/documents/sslc/'+req.body.tokennumber+'sslc.pdf')
        }
        if(req.files.plustwo)
        {
          var plustwo=req.files.plustwo
          plustwo.mv('./public/uploads/documents/plustwo/'+req.body.tokennumber+'plustwo.pdf')
        }
        if(req.files.resume)
        {
        var resume=req.files.resume
        resume.mv('./public/uploads/documents/resume/'+req.body.tokennumber+'resume.pdf')
        }
      }
    }
  
  
  })
  
  router.get('/pdfview',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
      }
    }
  })
  
  router.get('/document_upload',(req,res)=>{
  
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        // res.send('working')
        res.render('admin/document_upload',{user})
      }
    }
  })
  
  router.get('/manage',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        res.render('../views/admin/manage',{user})
      }
    }
  })
  
  router.get('/manage/staff',async(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
       nttfHelper.getAllStaff().then((staff)=>{
         res.render('admin/view_teachers_privilege',{user,staff})
       })
      }
    }
  })
  
  router.get('/managecenter',(req,res)=>{
  
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        // res.send('working')
        res.render('admin/managecenter',{user})
      }
    }
  })
  
  router.get('/manage/listofcourse',async(req,res)=>{
  
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        courseHelper.getCourseAndStaff().then((course)=>{
          res.render('admin/listofcourse',{user,course})
        })
      }
    }
  })
  
  router.post('/manage/listofcourse',async(req,res)=>{
  
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        var course=req.body
        courseHelper.addCourse(course).then((status)=>{
          if(status.status)
          {
            req.session.courseAddStatus="course added succesfully"
          }
          else
          {
            req.session.courseAddStatus="course already exist"
          }
          res.redirect('/manage/listofcourse')
    
        })
      }
    }
  })
  
  router.get('/dashboard/listofcourse/edit/:id',(req,res)=>{
  
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        var courseid=req.params.id
        courseHelper.getCourse(courseid).then((course)=>{
          res.render('admin/editcourse',{user,course})
  
        })
      }
    }
  })
  
  router.get('/manage/staff/edit/:id',async(req,res)=>{
  
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        var staffId=req.params.id
        var course=await courseHelper.getAllCourse()
        nttfHelper.getStaff(staffId).then((staff)=>{
          res.render('admin/privilege',{user,
                                        staff,
                                        course,
                                        editRoleTrue:req.session.editRoleTrue,
                                        editRoleFalse:req.session.editRoleFalse
                                      })
          req.session.editRoleTrue=null
          req.session.editRoleFalse=null
        })
      }
    }
  })
  
  router.post('/manage/staff/edit/:id',async(req,res)=>{
  
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        var staff=req.body
        staff.staffid=req.params.id
        nttfHelper.editRole(staff).then((status)=>{
          if(status.status)
          {
            req.session.editRoleTrue=true
          }
          else
          {
            req.session.editRoleFalse=true
          }
          res.redirect('/manage/staff/edit/'+staff.staffid)
        })
      }
    }
  })
  
  router.get('/manage/staff/edit/remove/:id',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        nttfHelper.removeRole(req.params.id).then(()=>{
          res.redirect('/manage/staff')
        })
      }
    }
  })
  
  router.get('/manage/semester',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
          courseHelper.getAllCourse().then((course)=>{
            res.render('admin/semester_edit',{user,course})
          })
      }
    }  
  })
  
  router.post('/manage/semester',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        semesterHelper.updateSemester(req.body)
        semesterHelper.updateYear().then(()=>{
        })
      }
    }  
  })
  
  router.get('/dashboard/viewstaff/profile/remove/:id',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        nttfHelper.removeStaff(req.params.id).then(()=>{
        })
      }
    }  
  })
  
  router.post('/dashboard/mentoring/student',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        var tokennumber=req.query.id
        mentoringHelper.addMentor(tokennumber,req.body).then(()=>{
          // res.redirect('/dashboard/mentoring/student/'+tokennumber) //works in sweet alert
        })
      }
    }
  })

  // router.get('/dashboard/mentoring/student/delete',(req,res)=>{
  //   user=req.session.user
  //   if(user)
  //   {
  //     if(user.admin)
  //     {
  //     }
  //   }
  // })
  
  
  router.get('/manage/nocn',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        res.render('admin/nocnmodule',{user})
      }
    }  
  })
  router.post('/manage/nocn',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        nocnHelper.addModule(req.body).then(()=>{
          res.redirect('/manage/nocn')
        })
      }
    }
  })
  
  router.get('/dashboard/nocn/module/:id',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        moduleid=req.params.id
        res.render('admin/nocn_completion',{user})
      }
    }
  })
  
  router.get('/dashboard/nocn/editstatus',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        res.render('admin/nocneditstatus',{user})
      }
    }
  })


  // router.get('/create-admin',(req,res)=>{
  //   user=req.session.user
  //   if(user)
  //   {
  //     if(user.admin)
  //     {
  //       res.render('../views/admin/create_admin',{user})
  //     }
  //   }
  // })

  // router.post('/create-admin',(req,res)=>{
  //   user=req.session.user
  //   if(user)
  //   {
  //     if(user.admin)
  //     {
  //       nttfHelper.addAdmin(req.body).then((id)=>{
  //           res.redirect('/create_admin')
  //         })
  //     }
  //   }
    
  // })





  router.get('/notification',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        res.render('../views/admin/notification',{user})
      }
    }
  })
  
  router.get('/about',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        res.render('../views/admin/about',{user})
      }
    }
  })
  router.get('/traineereport',async(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        var course=await courseHelper.getAllCourse()
        res.render('admin/traineereport',{user,course})
      }
    }
  })
  // router.get('/attendancetable',(req,res)=>{
  //   user=req.session.user
  //   if(user)
  //   {
  //     if(user.admin)
  //     {
  //       attendanceHelper.getAttendance().then((attendance)=>{
  //       res.render('./admin/attendance',{user,attendance})
  //       })
  //     }
  //   }
  // })

  router.get('/reports',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        res.render('../views/admin/reports',{user})
      }
    }
  })

  router.get('/reports/loginreports',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        nttfHelper.viewLoginInfo().then((logins)=>{
          res.render('../views/admin/loginreports',{user,logins})
        })
      }
    }
  })

  router.get('/reports/loginreports/deletereports',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        nttfHelper.deleteLoginInfo()
        res.render('../views/admin/loginreports',{user})
      }
    }
  })


  router.get('/document_upload/viewdocuments',async(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        console.log("Just checking")
        // nttfHelper.viewAllTrainees().then((trainees)=>{
        //   res.render('admin/pdfview',{user})
        // })

     //  excelConvertHelper.getTraineeProfile(user.adminid)
      //  data.mv('./public/excel.xlsx')
       // res.download('./public/downloads/profiles/profile'+user.adminid+'.xlsx')
        // fs.unlinkSync('profile.xlsx');

        // _________________

        excelConvertHelper.getTraineeByYearCourse(user.adminid,1,'cp08');
        res.download('./public/downloads/profiles/profile.xlsx')
      }
    }
  })

  router.get('/document_upload/viewdocuments/profile/:id',(req,res)=>{
    if(user)
    {
      if(user.admin)
      {
        var tokennumber=req.params.id
        var aadhar= require('./public/uploads/documents/aadhar/ttc0820002aadhar.pdf')

      }
    }
  })

  router.post('/traineereport',async(req,res) => {
  user = req.session.user;
    if(user){
      if(user.admin){
        await excelConvertHelper.getTraineeByYearCourse(req.body.course, req.body.year);
        console.log("After Await");
        res.download('./public/downloads/profiles/profile.xlsx')
      }
    }
  })

  router.get('/reports/mentorstudent',async(req,res)=>{
    user =  req.session.user
    if(user)
    {
      if(user.admin)
      {
        res.render('admin/mentorStudent',{user})
      }
    }
  })

  router.post('/reports/mentorstudent',async(req,res)=>{
    user =  req.session.user
    if(user)
    {
      if(user.admin)
      {
        excelConvertHelper.getMentoringByTrainee(req.body.tokennumber).then((status)=>{
          if(status)
          {
          res.download('./public/downloads/profiles/'+req.body.tokennumber+'mentor.xlsx')
          }
        })
      }
    }
  })

  router.get('/settings',(req,res)=>{
    user=req.session.user
    if(user)
    {
        res.render('admin/password_change',{user,status:req.session.loginStatus})
        req.session.loginStatus=null

    }
  })

  router.post('/settings',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        nttfHelper.changePassword(req.body,user.adminid).then((status)=>{
          req.session.loginStatus=status
          if(status.currentPasswordError)
          {
            res.redirect('/settings')
          }
          else if(status.confirmPasswordError)
          {
            res.redirect('/settings')
          }
          else if(status.passwordChange)
          {
            res.redirect('/settings')
          }
        })
      }
      else if(user.staff)
      {
        nttfHelper.changePassword(req.body,user.staffid).then((status)=>{
          req.session.loginStatus=status
          if(status.currentPasswordError)
          {
            res.redirect('/settings')
          }
          else if(status.confirmPasswordError)
          {
            res.redirect('/settings')
          }
          else if(status.passwordChange)
          {
            res.redirect('/settings')
          }
        })
      }
      else if(user.tokennumber)
      {
        nttfHelper.changePassword(req.body,user.tokennumber).then((status)=>{
          req.session.loginStatus=status
          if(status.currentPasswordError)
          {
            res.redirect('/settings')
          }
          else if(status.confirmPasswordError)
          {
            res.redirect('/settings')
          }
          else if(status.passwordChange)
          {
            res.redirect('/settings')
          }
        })
      }
    }
  })


  router.post('/dashboard/mentoring/student/changestatus/:id',(req,res)=>{
    user=req.session.user
    if(user)
    {
      if(user.admin)
      {
        var tokennumber=req.params.id
        var mentorStatus=req.body.mentorstatus
        mentoringHelper.changeStatus(tokennumber,mentorStatus).then(()=>{
          res.redirect('/dashboard/mentoring/student?id='+tokennumber)
        })
      }
    }
  })

//admin routes end here

//staffroutes


router.get('/profile',(req,res)=>{
  user=req.session.user

  if(user)
  {
    if(user.staff)
    {
      nttfHelper.getStaff(user.staffid).then((profile)=>{
        
        res.render('../views/admin/admin_profile',{user,profile})
      })
    }

  }
})
router.get('/staff/dashboard/viewtrainees',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.staff)
    {
      nttfHelper.getTraineeByCourseId(user.course,user.year).then((trainees)=>{
        res.render('staff/view_trainees',{user,trainees})
      })
    }
  }
})

router.get('/staff/dashboard/viewtrainees/profile/:id',async(req,res)=>{

  user=req.session.user
  if(user)
  {
    if(user.staff)
    {
      let traineeId=req.params.id
      var trainee=await nttfHelper.viewTrainee(traineeId)
      res.render('staff/profile',{trainee,user})
    }
  }
})

router.get('/staff/dashboard/viewtrainees/profile/edittraineeinfo/:id',async(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.staff)
    {
      var trainee=await nttfHelper.viewTrainee(req.params.id)
      res.render('staff/edit_traineeinfo',{user,trainee})
    }
  }
})
 
router.post('/staff/dashboard/viewtrainees/profile/edittraineeinfo/:id',(req,res)=>{

  user=req.session.user
  if(user)
  {
    if(user.staff)
    {
      let traineeId=req.params.id
      nttfHelper.editTrainee(req.body,traineeId).then(()=>{
      
      })
    }
  }
})

router.get('/staff/dashboard/mentoring',(req,res)=>{
  if(user)
  {
    if(user.staff)
    {
      nttfHelper.getTraineeByCourseId(user.course,user.year).then((trainees)=>{
        res.render('staff/mentoring_table',{user,trainees})
        })
    }
  }
})

router.get('/staff/dashboard/mentoring/student',(req,res)=>{
  if(user)
  {
    if(user.staff)
    {
      nttfHelper.viewTrainee(req.query.id).then(async(trainee)=>{
        var mentor=await mentoringHelper.viewMentor(req.query.id)
        res.render('staff/mentoring_profile',{user,trainee,mentor})
      })
    }
  }
})

router.post('/staff/dashboard/mentoring/student/changestatus/:id',(req,res)=>{
  if(user)
  {
    if(user.staff)
    {
        var id=req.params.id
        mentoringHelper.changeStatus(id , req.body.mentorstatus).then(()=>{
        res.redirect('/staff/dashboard/mentoring/student?id='+id)
      })
    }
  }
})

router.post('/staff/dashboard/mentoring/student',(req,res)=>{
  if(user)
  {
    if(user.staff)
    {
      var tokennumber=req.query.id
      mentoringHelper.addMentor(tokennumber,req.body).then(()=>{
        //route changes in sweet alert
      })
    }
  }
})

router.get('/staff/dashboard/mentoring/student/removecomment',(req,res)=>{
  if(user)
  {
    if(user.staff)
    {
      var tokennumber=req.query.tokennumber
      var index=req.query.index
      mentoringHelper.removeComment(tokennumber,index).then(()=>{
        res.redirect('/staff/dashboard/mentoring/student?id='+tokennumber)
      })
    }
  }
})


router.get('/staff/dashboard/attendanceentry',async(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.staff)
    {
      
      // nttfHelper.getTraineeByCourseId(user.course,user.year).then((trainees)=>{
      //   res.render('staff/attendance_entry',{user,trainees})
      // })
      var course=user.course
      var year=user.year
      var attendanceStatus=await checkEntry(course+year)
      if(attendanceStatus.status)
      {
        nttfHelper.getTraineeByCourseId(course,year).then((trainees)=>{
          res.render('staff/attendance_entry',{user,trainees})
          })
      }
      else
      {
        req.session.attendanceFail=true
        res.render('staff/attendance_entry',{user,status:req.session.attendanceFail})
        req.session.attendanceFail=null
      }
    }
  }
  
})

router.post('/staff/dashboard/attendanceentry',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.staff)
    {
      var course=user.course
      var year=user.year
      var students=convertToBoolean(req.body)
      attendanceHelper.addAttendance(students,course,year).then(()=>{
      attendanceHelper.attendancePercentage(course+year)

    })
    }
  }
})

router.get('/staff/dashboard/viewattendance',(req,res)=>{
  user=req.session.user
  course=user.course
  year=user.year
  if(user)
  {
    if(user.staff)
    {
      attendanceHelper.getAttendance(course+year).then((attendance)=>{
        res.render('staff/attendance_view',{user,attendance})
      })
    }
  }
})

router.post('/staff/viewattendancebymonth',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.staff)
    {
      var body=req.body
      var date=new Date(body.date)
      var cname=user.course+user.year
      attendanceHelper.getAttendanceByMonth(date,cname).then((attendance)=>{
        res.render('staff/attendance_view',{user,attendance})
      })
    }
  }
})



router.post('/staff/viewattendance',async(req,res)=>{

  var user=req.session.user
  var date=req.body
  var attendance=await attendanceHelper.getAttendanceByMonth(new Date(date.month),user.course+user.year)
  res.render('staff/attendance_view',{user,attendance})

})

router.get('/documents',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.staff)
    {
      res.render('staff/document_view_upload',{user})
    }
  }
})

router.get('/documents/upload',async(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.staff)
    {
      var trainees=await nttfHelper.getTraineeByCourseId(user.course,user.year)
      res.render('staff/upload_data',{user,trainees})
    }
  }
})

router.get('/documents/download',async(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.staff)
    {
      var trainees=await nttfHelper.getTraineeByCourseId(user.course,user.year)
      res.render('staff/documenttraineelist',{user,trainees})
    }
  }
})

router.get('/documents/download/:id',async(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.staff)
    {
      res.render('staff/document_download',{user})
    }
  }
})





//staff routes end here
//Student router starts here




router.get('/student/dashboard/profile',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.tokennumber)
    {
      nttfHelper.viewTrainee(user.tokennumber).then((trainee)=>{
        res.render('students/profile',{user,trainee})
      })
    }
  }
})

router.get('/student/dashboard/attendance',(req,res)=>{
  user=req.session.user
  if(user)
  {
    if(user.tokennumber)
    {
      attendanceHelper.getAttendanceByTrainee(user).then((attendance)=>{
        res.render('students/attendancetable',{user,attendance})
      })
    }
  }
})

router.get('*',(req,res)=>{
  res.send('<h1> Page not found </h1>')
})



module.exports = router;



//functions
function convertToBoolean(obj){

  var students={}

  
  
  for(var i=0;i<Object.keys(obj).length;i++){
     if (Object.values(obj)[i]=='true')
     {
       var tokennumber=Object.keys(obj)[i]
        students[tokennumber]=true
     }
     else
     {
       var tokennumber=Object.keys(obj)[i]
       students[tokennumber]=false
     }
  }


  return students
}

async function checkEntry(cname){
  let attendance=await db.nttfDb().collection(cname+"attendance").findOne()
  if(attendance)
  {
    var dateStatus=attendance.status
        for(var i=0;i<dateStatus.length;i++)
        {
            var enteredDate=dateOnly(dateStatus[i].date)
            var todayDate=dateOnly(new Date())
            if(enteredDate === todayDate)
            {
                return ({status:false})
            }
        }
        return ({status:true})
  }
  else
  {
          return ({status:true})      
  }
        
}


function dateOnly(date){

  var day=date.getDate()  
  var month=date.getMonth()+1 
  var year=date.getFullYear()

  return day+'/'+month+'/'+year
}