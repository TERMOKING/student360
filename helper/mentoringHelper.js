const { token } = require('morgan')
var db=require('../config/connection')

module.exports={
    addMentor:async(tokennumber,description)=>{

        var student=await db.nttfDb().collection('mentoring').findOne({tokennumber:tokennumber})
        if(student)
        {

            var mentor={
                date:new Date(),
                description:description.description,
                category:description.category
            }

            db.nttfDb().collection('mentoring').updateOne({tokennumber:tokennumber},
                {
                    $push:{mentor:mentor}
                })

        }
        else
        {
            var mentor={
                tokennumber:tokennumber,
                mentor:[
                    {
                        date:new Date(),
                        description:description.description,
                        category:description.category
                    }
                ]
            }
            db.nttfDb().collection('mentoring').insertOne(mentor)
        }

    },
    viewMentor:async(tokennumber)=>{

        var mentor=await db.nttfDb().collection('mentoring').findOne({tokennumber:tokennumber})
        if(mentor)
        {
            if(mentor.mentor)
            {
                mentor=mentorDateToString(mentor)
            }
            else
            {
                return mentor
            }
        }
        else
        {

        }
        
        return mentor
    },
    changeStatus:(tokennumber,mentorstatus)=>{
        return new Promise((resolve,reject)=>{
            db.nttfDb().collection('trainees').updateOne({tokennumber:tokennumber},
                {
                    $set:{
                        mentorstatus:mentorstatus
                    }
                })
                resolve()
        })
    },
    removeComment:(tokennumber,index)=>{
        var i=parseInt(index)
        return new Promise(async(resolve,rejct)=>{
            await db.nttfDb().collection('mentoring').updateOne({tokennumber:tokennumber},
                {
                    $unset:{
                        "mentor":1
                    },
                })
                db.nttfDb().collection('mentoring').updateOne({tokennumber:tokennumber},
                    {
                        $pull : {
                            "mentor" : null
                        },
                    })
                resolve()
        })
    }
}


function mentorDateToString(mentor)
{
    var status=mentor.mentor
    for(var i=0;i<status.length;i++)
    {
        var date=dateOnly(status[i].date)
        status[i].date=date
    }
    mentor.mentor=status
    return mentor
}


function dateOnly(date){

    var day=date.getDate()  
    var month=date.getMonth()+1 
    var year=date.getFullYear()
  
    return day+'/'+month+'/'+year
  }