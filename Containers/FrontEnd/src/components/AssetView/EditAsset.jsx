import React, { useEffect, useState } from 'react'
import { AddIcon, CheckIcon, ConnectionIcon, CrossIcon, LinkAddIcon, RemoveIcon } from '../common/Icons/Icons';
import { UpdateAsset } from '../Services/ApiService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { useMutation } from '@tanstack/react-query';

export default function EditAsset({ assetData, assetID, relationData, refetch }) {
    const [errorMessage, setErrorMessage] = useState(null)

    const dontDisplayList = ["Created at", "Updated at", "Hostname"];
    const [properties, setProperties] = useState({});
    const [relations, setRelations] = useState({});
    const [showButtons, setShowButtons] = useState(false);
    const [removedRelations, setRemovedRelations] = useState([]);
    const [addedRelations, setAddedRelations] = useState([]);
    const [showAddRelation, setShowAddRelation] = useState(false)

    const emptyRelation = { "from": "", "to": "", "owner": "", "direction": "uni" };
    const [newRelationData, setNewRelationData] = useState(emptyRelation)

    const { mutate, isPending, isError, error, isSuccess } = useMutation({
        mutationFn: UpdateAsset, // Directly pass the LogIn function
        onSuccess: (data) => {
            // Handle success logic here, no need for useEffect
            refetch()
            window.location.reload()
            console.log("message: ", data);
            // handleUpdate()
            // handleReset()
            // if (data.message) {
            //     setErrorMessage(null)
            // } else {
            //     setErrorMessage("Could not update asset")
            // }
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("Update error:", error.message);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // const mutationObject = { "updateAsset": { [assetID]: properties }, "removeRelations": removedRelations, "addRelations": addedRelations };
        // const mutationObject = { "addRelations": addedRelations };
        const mutationObject = { "removeRelations": removedRelations, "addRelations": addedRelations };
        console.log(JSON.stringify(mutationObject, null, 2));

        mutate(mutationObject);
        // refetch() asset data etc.


        // maybe  handleReset() but should not be needed (instead of row below)
        setShowButtons(false);

    };
    const handleReset = () => {
        setProperties(assetData.properties);
        setRelations(relationData);
        setRemovedRelations([]);
        setNewRelationData(emptyRelation);
        setAddedRelations([])
        setShowButtons(false);
    };

    const removeRelation = (rid) => {
        setShowButtons(true)
        // Update displayed relations
        const { [rid]: _, ...updatedRelations } = relations;
        setRelations(updatedRelations);

        // Removed relations
        setRemovedRelations(currentRids => [...currentRids, rid])
    }

    const handleAddRelation = () => {
        setShowAddRelation(false)
        setShowButtons(true)
        setAddedRelations(addedrelations => [...addedrelations, newRelationData])
        setNewRelationData(emptyRelation)
    }

    useEffect(() => {
        handleReset();
    }, [assetID, relationData])


    return (
        <div className='asset-info-container'>
            <h1 style={{ marginBottom: "1rem" }}>{assetID}</h1>
            <form onSubmit={handleSubmit}>

                {Object.entries(properties).map(([key, value], index) => (
                    <div key={index}>
                        {
                            !dontDisplayList.includes(key) &&
                            <div className='inputContainer'>
                                <label className='inputLabel'>{key}</label>
                                <input
                                    className="inputFields"
                                    value={value}
                                    onChange={(e) => {
                                        setProperties({ ...properties, [key]: e.target.value });
                                        setShowButtons(true);
                                    }}
                                    id={key}
                                    type={(key === "Criticality") ? "number" : "text"}
                                    min={(key === "Criticality") ? 1 : null}
                                    max={(key === "Criticality") ? 5 : null}
                                    name={key}
                                />
                            </div>
                        }
                    </div>
                ))}

                <hr />

                <div >
                    <h3>Relations </h3>
                    <div className='relation-content_button'>
                        <div className="relations-container" >
                            {Object.entries(relations).map(([key, value]) => (
                                <div key={key} className='relation'>
                                    <a style={{ marginRight: "1rem" }}>{value.from}</a>
                                    <ConnectionIcon size={19} color={"var(--text-hover)"} />
                                    <a style={{ margin: "0rem 1rem" }}>{value.to}</a>
                                    <div onClick={() => removeRelation(key)}>
                                        <RemoveIcon size={22} color={"var(--error-color)"} />
                                    </div>
                                </div>

                            ))}
                            {addedRelations.map((relation, index) => (
                                <div key={index} className='relation'>
                                    <a style={{ marginRight: "1rem" }}>{relation.from}</a>
                                    <ConnectionIcon size={19} color={"var(--text-hover)"} />
                                    <a style={{ margin: "0rem 1rem" }}>{relation.to}</a>
                                    <LinkAddIcon size={22} color={"var(--success-color)"} />
                                </div>

                            ))}
                        </div>
                        {!showAddRelation &&
                            <div style={{ marginTop: "1.25rem" }} onClick={() => { setShowAddRelation(true) }}>
                                <AddIcon size={36} color={"var(--success-color)"} />
                            </div>
                        }
                        {showAddRelation &&
                            <div className='addRelation-container' style={{ marginTop: "1.25rem" }}>
                                <h3 style={{ marginBottom: "1rem" }}>Add Relation </h3>
                                {Object.entries(newRelationData).map(([key, value], index) => (
                                    <div key={index}>
                                        <div className='inputContainer'>
                                            <label className='inputLabel'>{`${key[0].toUpperCase()}${key.slice(1)}`}</label>
                                            <input
                                                className="inputFields"
                                                value={value}
                                                onChange={(e) => setNewRelationData({ ...newRelationData, [key]: e.target.value })}
                                                id={key}
                                                name={key}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="standard-button-container">
                                    <div style={{ marginRight: "2rem" }} onClick={handleAddRelation}>
                                        <CheckIcon size={35} color={"var(--success-color)"} />
                                    </div>
                                    <div onClick={() => setShowAddRelation(false)}>
                                        <CrossIcon size={35} color={"var(--error-color)"} />
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
                {showButtons &&
                    <div className="standard-button-container">
                        <button className="standard-button" disabled={isPending} type="submit">Save</button>
                        <button className="standard-button" disabled={isPending} onClick={handleReset}>Cancel</button>
                    </div>

                }
                {isPending && <LoadingSpinner />}
                {isError && <div className='errorMessage'>{error.message}</div>}
                {errorMessage && <div className='errorMessage'>{errorMessage}</div>}
            </form>
        </div>
    )
}
