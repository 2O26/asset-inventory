import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import './AssetView.css'


export default function AssetView() {
    const postData = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!postData.state) {
            navigate('/');
        }
    }, [postData.state, navigate]);

    if (!postData.state) {
        return <div>Loading...</div>; // or null, or any placeholder you prefer
    }

    return (
        <div className='asset-view-container'>
            <div className='asset-info-container'>
                <div key={postData.state.Standard.Name} >
                    {/* Standard information */}
                    {Object.entries(postData.state.Standard).map(([key, value], index) => (
                        index === 0 ? <h1 key={key} name="asset-name">{value}</h1> : (
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
