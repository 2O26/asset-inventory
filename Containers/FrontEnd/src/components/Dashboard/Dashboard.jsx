import React from 'react'
import './Dashboard.css'
import { dashboardTools } from '../Tools/Tools.jsx'

const tools75by50 = ["Graph View", "Asset List", "Graph View"]
const tools25by50 = ["Asset List", "Graph View", "Asset List"]

export default function Dashboard() {
    return (
        <div className='dashboard-container' >
            <div className='container-75-50'>
                {tools75by50.map((key, index) => (
                    <div key={index} className='item-75-50'>
                        <h3 className='item-header-ds'>{dashboardTools({ size: 24 })[key].icon} {key} </h3>
                        {dashboardTools({ width: "68vw", height: "60vh" })[key].component}
                    </div>
                ))}
            </div>
            <div className='container-25-50'>
                {tools25by50.map((key, index) => (
                    <div key={index} className='item-25-50'>
                        <h3 className='item-header-ds' >{dashboardTools({ size: 24 })[key].icon} {key} </h3>
                        {dashboardTools({ width: "26vw", height: "60vh" })[key].component}
                    </div>
                ))}
            </div>
        </div>
    )
}
