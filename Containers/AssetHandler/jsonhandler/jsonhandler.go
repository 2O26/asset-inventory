package jsonhandler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/netip"
	"time"

	"github.com/mitchellh/mapstructure"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AuthResponse struct {
	Authenticated   bool     `json:"authenticated"`
	Roles           []string `json:"roles"`
	IsAdmin         bool     `json:"isAdmin"`
	CanManageAssets bool     `json:"canManageAssets"`
}

type Asset struct {
	Name        string   `json:"Name"`
	Owner       string   `json:"Owner"`
	Type        []string `json:"Type"` // array with type -> subtype -> sub-subtype, etc
	DateCreated string   `json:"Created at"`
	DateUpdated string   `json:"Updated at"`
	Criticality int      `json:"Criticality"`
	IP          string   `json:"IP"`
	Hostname    string   `json:"Hostname"`
}

type networkAsset struct {
	Status    string `bson:"status" json:"status"`
	IPv4Addr  string `bson:"ipv4Addr" json:"ipv4Addr"`
	OpenPorts []int  `bson:"openPorts" json:"openPorts"`
}

type FrontAsset struct {
	Asset   `json:"properties"`
	Plugins map[string]any `json:"plugins"`
}

type Plugin struct {
	PluginStateID string `json:"pluginStateID"`
}

// Relation 'Relations will stay the same between front and back data'
type Relation struct {
	From        string `json:"from"`
	To          string `json:"to"`
	Direction   string `json:"direction"`
	Owner       string `json:"owner"`
	DateCreated string `json:"dateCreated"`
}

type BackState struct {
	ID               primitive.ObjectID     `bson:"_id,omitempty" json:"id,omitempty"`
	MostRecentUpdate time.Time              `json:"mostRecentUpdate"`
	Assets           map[string]Asset       `json:"assets"`
	Plugins          map[string]Plugin      `json:"plugins"`
	Relations        map[string]Relation    `json:"relations"`
	PluginStates     map[string]PluginState `json:"pluginStates"`
}

type FrontState struct {
	MostRecentUpdate string                `json:"mostRecentUpdate"`
	Assets           map[string]FrontAsset `json:"assets"`
	Relations        map[string]Relation   `json:"relations"`
	PluginList       []string              `json:"pluginList"`
}

type PluginState struct {
	StateID     string                 `json:"stateID"`
	DateCreated string                 `json:"dateCreated"`
	DateUpdated string                 `json:"dateUpdated"`
	State       map[string]interface{} `json:"state"`
}

// BackToFront Takes a state, an arbitrary amount of plugin names and plugin data and formats the output to the style used in frontend.
// Only one plugins map should be sent to the function.
func BackToFront(assetState json.RawMessage, plugins map[string]json.RawMessage) (json.RawMessage, error) {

	var in BackState
	var out FrontState

	outAssets := make(map[string]FrontAsset)

	err := json.Unmarshal(assetState, &in)
	if err != nil {
		return nil, errors.New("could not unmarshal assetState JSON")
	}

	// copy stuff here
	out.MostRecentUpdate = in.MostRecentUpdate.Format(time.RFC3339)

	out.Relations = in.Relations
	copyAssets(in.Assets, outAssets) //written by Gemini
	// Check if the pluginList is already populated
	for pluginName := range in.Plugins {
		found := false
		for _, existingPlugin := range out.PluginList {
			if pluginName == existingPlugin {
				found = true
				break
			}
		}
		// If not found, add the plugin to the list
		if !found {
			out.PluginList = append(out.PluginList, pluginName)
		}
	}
	if plugins != nil {
		//need to unmarshal all pluginStates
		pluginStates := make(map[string]PluginState)

		for key, value := range plugins {
			out.PluginList = append(out.PluginList, key)
			var temp PluginState

			err := json.Unmarshal(value, &temp)
			if err != nil {
				return nil, errors.New("could not unmarshal pluginState json")
			}

			pluginStates[key] = temp
		}
		//All pluginStates have been unmarshalled, can now copy
		insertPluginData(outAssets, pluginStates)
	}
	// Copy pluginStates to output
	for pluginStateID, pluginState := range in.PluginStates {
		for asset, pluginAssetData := range pluginState.State {
			for assetID, frontAsset := range outAssets {
				// If the asset matches the plugin asset, add the plugin data
				if assetID == asset {
					if frontAsset.Plugins == nil {
						frontAsset.Plugins = make(map[string]any)
					}
					frontAsset.Plugins[pluginStateID] = pluginAssetData
					outAssets[assetID] = frontAsset
				}
			}
		}
	}
	out.Assets = outAssets //need to put output in out.assets as indices can't be modified

	toPrint, err := json.Marshal(out)

	return toPrint, err

}

// Copies assets from Asset struct to FrontAsset struct.
func copyAssets(inAssets map[string]Asset, outAssets map[string]FrontAsset) {
	for name, asset := range inAssets {

		outAsset := FrontAsset{
			Asset:   asset,                // Embed the original Asset data directly
			Plugins: make(map[string]any), // Initialize the Plugins map
		}
		outAssets[name] = outAsset
	}
}

func insertPluginData(inAssets map[string]FrontAsset, plugins map[string]PluginState) {
	for pluginName, pluginState := range plugins {
		for pluginAssetName, pluginAsset := range pluginState.State {
			asset, found := inAssets[pluginAssetName]
			if found {
				// If a Plugins map already exists, merge with existing data
				if asset.Plugins == nil {
					asset.Plugins = map[string]any{}
				}
				asset.Plugins[pluginName] = pluginAsset.(map[string]any)
			} else {
				// If not found, create a new entry with plugin data
				inAssets[pluginAssetName] = FrontAsset{
					Asset:   asset.Asset,
					Plugins: map[string]any{pluginName: pluginAsset.(map[string]any)},
				}
			}
		}
	}
}

func NeedToKnow(inState FrontState, auth AuthResponse) FrontState {
	// Function will be primarily used to filter out data that the user does not have access to
	var alteredState FrontState
	alteredState.Assets = make(map[string]FrontAsset)
	alteredState.Relations = make(map[string]Relation)
	alteredState.PluginList = inState.PluginList
	alteredState.MostRecentUpdate = inState.MostRecentUpdate

	//find assets that user can view, and add them to the state
	for assetID, asset := range inState.Assets {
		netscanData, ok := asset.Plugins["netscan"].(map[string]any)
		if ok {
			var netProps networkAsset
			err := mapstructure.Decode(netscanData, &netProps)
			if err != nil {
				continue
			}
			var assetIP netip.Addr
			assetIP, err = netip.ParseAddr(asset.IP)
			if err != nil {
				fmt.Println("Error parsing IP: ", assetIP, "ERROR:", err)
				continue
			}
			for _, role := range auth.Roles {
				fmt.Println("ROLE", role)
				var network netip.Prefix
				network, err = netip.ParsePrefix(role)
				if err != nil {
					//role is not a subnet role
					continue
				}
				if network.Contains(assetIP) {
					// user can view asset, add it to alteredState
					alteredState.Assets[assetID] = asset
				}
			}
		} else {
			// asset does not have netscan data, and since all users have access to manually added assets
			// we add them. Edge case being the subnet assets
			if len(auth.Roles) <= 0 {
				if asset.Type[0] != "Subnet" {
					alteredState.Assets[assetID] = asset
				}
			} else {
				for _, role := range auth.Roles {
					if asset.Type[0] != "Subnet" {
						//Not a subnet asset, add it
						alteredState.Assets[assetID] = asset
					} else if asset.Type[0] == "Subnet" && asset.Name == role {
						alteredState.Assets[assetID] = asset
					}
				}
			}
		}
	}
	//also need to copy relations
	for relationID, relation := range inState.Relations {
		from := false
		to := false
		for assetID := range alteredState.Assets {
			if relation.From == assetID {
				from = true
			} else if relation.To == assetID {
				to = true
			}
		}
		if from && to {
			alteredState.Relations[relationID] = relation
		}
	}
	alteredStateJSON, _ := json.Marshal(alteredState)
	fmt.Println("Altered state: ", string(alteredStateJSON))
	return alteredState
}

// FilterBySubnets is a variant of NeedToKnow used when creating a PDF report of the inventory
// This function filters out data based on subnets specified when requesting the report
func FilterBySubnets(inState FrontState, auth AuthResponse, subnets []string) FrontState {
	var alteredState FrontState
	alteredState.Assets = make(map[string]FrontAsset)
	alteredState.Assets = make(map[string]FrontAsset)
	alteredState.Relations = make(map[string]Relation)
	alteredState.PluginList = inState.PluginList
	alteredState.MostRecentUpdate = inState.MostRecentUpdate
	manualAssets := false // used to check if the user wants manually added assets in their report. Key is "manual-assets"
	rolesAndSubnets := make(map[string]bool)

	if auth.IsAdmin {
		for _, subnet := range subnets {
			if subnet == "manual-assets" {
				manualAssets = true
			}
			rolesAndSubnets[subnet] = true
		}
	} else {
		//user is not admin, need to check if user has access to requested subnets
		for _, subnet := range subnets {
			if subnet == "manual-assets" {
				manualAssets = true
			}
			for _, role := range auth.Roles {
				if subnet == role {
					rolesAndSubnets[subnet] = true
				}
			}
		}
	}

	for assetID, asset := range inState.Assets {
		//check if netscan data exists
		netscanData, ok := asset.Plugins["netscan"].(map[string]any)
		if ok {
			var netProps networkAsset
			err := mapstructure.Decode(netscanData, &netProps)
			if err != nil {
				continue
			}
			for accessible := range rolesAndSubnets {
				network, err := netip.ParsePrefix(accessible)
				if err != nil {
					//role is not a subnet role
					continue
				}
				assetIP, err := netip.ParseAddr(netProps.IPv4Addr)
				if err != nil {
					continue
				}
				if network.Contains(assetIP) {
					//user can view, add to alteredState
					alteredState.Assets[assetID] = asset
				}
			}
		} else {
			//asset does not have netscan data. adding accessible subnets and other manual assets if requested
			for accessible := range rolesAndSubnets {
				if accessible == asset.Name && asset.Type[0] == "Subnet" {
					//accessible subnet found, add it
					alteredState.Assets[assetID] = asset
				}
			}
			if manualAssets && asset.Type[0] != "Subnet" {
				alteredState.Assets[assetID] = asset
			}
		}
	}

	//copying relations
	for relationID, relation := range inState.Relations {
		from := false
		to := false
		for assetID := range alteredState.Assets {
			if relation.From == assetID {
				from = true
			} else if relation.To == assetID {
				to = true
			}
		}
		if from && to {
			alteredState.Relations[relationID] = relation
		}
	}
	alteredStateJSON, _ := json.Marshal(alteredState)
	fmt.Println("Altered state: ", string(alteredStateJSON))
	return alteredState

}
