import React from 'react'
import { useLocation } from 'react-router-dom';
import './AssetView.css'


export default function AssetView() {
    const postData = useLocation();
    return (
        <div className='asset-view-container'>
            <div className='asset-info-container'>
                <div key={postData.state.Standard.Name} >
                    {/* Standard information */}
                    {Object.entries(postData.state.Standard).map(([key, value], index) => (
                        index === 0 ? <h1 key={key}>{value}</h1> : (
                            <div key={key} className='assetItem'>
                                {key} : {value}
                            </div>
                        )
                    ))}

                    {/* Plugin information */}
                    {Object.values(postData.state.Plugin).map(plugin => (
                        <React.Fragment key={Object.keys(plugin)[0]}>
                            {Object.entries(plugin).map(([key, value]) => (
                                <div key={key} className='assetItem'>
                                    {key} : {value}
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    )
}
