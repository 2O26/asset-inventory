import React, { useState } from 'react'
import Modal from 'react-modal';
import './AddAsset.css'
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';

export default function AddAsset({ setPrevData }) {
    const [data, setData] = useState({ id: "", name: "", type: "", crit: 1, owner: "" })

    const [isLoading, setIsLoading] = useState(false)
    const [isError, setIsError] = useState(false)

    const [open, setOpen] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        const newAsset = {
            [data.id]: {
                "Relation ID": [],
                "Standard": {
                    "Name": data.name,
                    "Type": data.type,
                    "Criticality": parseInt(data.crit, 10),
                    "Owner": data.owner
                },
                "Plugin": {
                    // Plugins may need to be added or updated elsewhere
                }
            }
        };

        setPrevData(prevData => ({
            ...prevData,
            "Asset List": {
                ...prevData["Asset List"],
                ...newAsset
            }
        }));

        // Clear data
        setData({ id: "", name: "", type: "", crit: 0 });

        setIsLoading(false);
        setOpen(false);
        setIsError(false);
    };


    // Modal.setAppElement(document.getElementById('root'));
    return (
        <div>
            <button onClick={() => setOpen(true)} className="standard-button" >Add Asset</button>
            <Modal
                isOpen={open}
                ariaHideApp={false}
                contentLabel="popup"
                overlayClassName="reactModalOverlay"
                className="reactModalContent"
                shouldReturnFocusAfterClose={false}>
                <div>
                    <form onSubmit={handleSubmit} className='asset-form'>
                        <h2 style={{ paddingBottom: "2rem" }}>Add Asset</h2>
                        <label >ID</label>
                        <input className="inputFields" value={data.id} onChange={(e) => setData({ ...data, id: e.target.value })} placeholder="ID_234241" id="asset-id" name="asset-id" required />
                        <label htmlFor="name">Asset Name</label>
                        <input className="inputFields" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} type="name" placeholder="Server A" id="asset-name" name="asset-name" required />
                        <label >Criticality</label>
                        <input className="inputFields" value={data.crit} onChange={(e) => setData({ ...data, crit: e.target.value })} type="number" id="asset-criticality" name="asset-criticality" min="1" max="5" required />
                        <label >Type</label>
                        <input className="inputFields" value={data.type} onChange={(e) => setData({ ...data, type: e.target.value })} placeholder="Web Server" id="asset-type" name="asset-type" required />
                        <label >Owner</label>
                        <input className="inputFields" value={data.owner} onChange={(e) => setData({ ...data, owner: e.target.value })} placeholder="John Doe" id="asset-owner" name="asset-owner" required />
                        {isLoading && <LoadingSpinner />}
                        {isError && <p className="errorMessage">Could not Add asset</p>}
                        <div className="AuthBtnContainer">
                            <button className="standard-button" disabled={isLoading} type="submit">Add</button>
                            <button className="standard-button" disabled={isLoading} onClick={() => setOpen(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    )
}
