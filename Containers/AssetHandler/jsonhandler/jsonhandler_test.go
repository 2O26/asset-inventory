package jsonhandler

import (
	"encoding/json"
	"testing"

	"github.com/wI2L/jsondiff"
)

func TestBackToFrontNoPlugin(t *testing.T) {
	in := `{
		"mostRecentUpdate": "2024-02-14 23:35:53",
		"assets": {
			"AID_4123523": {
				"Name": "PC-A",
				"Owner": "UID_2332",
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"Criticality": 2,
				"Hostname": "PC-A"
			},
			"AID_5784393": {
				"Name": "Chromecast",
				"Owner": "UID_2332",
				"Created at": "2024-02-10 20:04:20",
				"Updated at": "2024-02-14 23:00:30",
				"criticality": 1
			},
			"AID_9823482": {
				"Name": "Password Vault",
				"Owner": "UID_2332",
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"criticality": 4
			}
		},
		"plugins": {
			"ipScan": {
				"pluginStateID": "20240214-1300A"
			},
			"macScan": {
				"pluginStateID": "20240215-0800G"
			}
		},
		"relations": {
			"RID_2613785": {
				"from": "ID_4123523",
				"to": "ID_5784393",
				"direction": "uni",
				"owner": "UID_2332",
				"dateCreated":"2024-02-14 23:35:53"
			},
			"RID_6492733": {
				"from": "ID_5784393",
				"to": "ID_9823482",
				"direction": "bi",
				"owner": "UID_6372",
				"dateCreated": "2024-01-22 07:32:32"
			}    
		}    
	}
	`
	want := `{
		"mostRecentUpdate": "2024-02-14 23:35:53",
		"pluginList": null,
		"assets": {
			"AID_4123523": {
				"properties": {
					"Name": "PC-A",
					"Owner": "UID_2332",
					"Created at": "2024-02-14 23:00:00",
					"Updated at": "2024-02-14 23:00:30",
					"criticality": 2
				},
				"plugins": {}
			},
			"AID_5784393": {
				"properties": {
					"Name": "Chromecast",
					"Owner": "UID_2332",
					"Created at": "2024-02-10 20:04:20",
					"Updated at": "2024-02-14 23:00:30",
					"criticality": 1
				},
				"plugins": {}
			},
			"AID_9823482": {
				"properties": {
					"Name": "Password Vault",
					"Owner": "UID_2332",
					"Created at": "2024-02-14 23:00:00",
					"Updated at": "2024-02-14 23:00:30",
					"criticality": 4
				},
				"plugins": {}
			}
		},
		"relations": {
			"RID_2613785": {
				"from": "ID_4123523",
				"to": "ID_5784393",
				"direction": "uni",
				"owner": "UID_2332",
				"dateCreated": "2024-02-14 23:35:53"
			},
			"RID_6492733": {
				"from": "ID_5784393",
				"to": "ID_9823482",
				"direction": "bi",
				"owner": "UID_6372",
				"dateCreated": "2024-01-22 07:32:32"
			}
		}
	}`

	out, err := BackToFront(json.RawMessage(in), nil)
	diff, err2 := jsondiff.Compare(out, json.RawMessage(want))
	if err != nil || err2 != nil || diff != nil {
		t.Fatalf("Input did not create correct output. Difference is %s. Error: %s.", diff.String(), err)
	}

}

func TestBackToFrontBadPlugin(t *testing.T) {
	in := `{
		"mostRecentUpdate": "2024-02-14 23:35:53",
		"assets": {
			"AID_4123523": {
				"Name": "PC-A",
				"Owner": "UID_2332",
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"criticality": 2        
			},
			"AID_5784393": {
				"Name": "Chromecast",
				"Owner": "UID_2332",
				"Created at": "2024-02-10 20:04:20",
				"Updated at": "2024-02-14 23:00:30",
				"criticality": 1
			},
			"AID_9823482": {
				"Name": "Password Vault",
				"Owner": "UID_2332",
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"criticality": 4
			}
		},
		"plugins": {
			"ipScan": {
				"pluginStateID": "20240214-1300A"
			},
			"macScan": {
				"pluginStateID": "20240215-0800G"
			}
		},
		"relations": {
			"RID_2613785": {
				"from": "ID_4123523",
				"to": "ID_5784393",
				"direction": "uni",
				"owner": "UID_2332",
				"dateCreated":"2024-02-14 23:35:53"
			},
			"RID_6492733": {
				"from": "ID_5784393",
				"to": "ID_9823482",
				"direction": "bi",
				"owner": "UID_6372",
				"dateCreated": "2024-01-22 07:32:32"
			}    
		}    
	}
	`

	plugin := make(map[string]json.RawMessage)
	plugin["netscan"] = json.RawMessage(`{
		"sateID": "20240214-1300A",
		"dateCreated": "2024-02-14 23:00:00"
		"dateUpdated": "2024-02-14 23:00:30",
		"state": {
			"AID_412523": {
				"status": "up",
				"ipv4add": "192.168.1.1"
				"ipv6addr": "10:25:96:12:34:56",
				"subnet": "192.168.1.0/24"
			},
			"AID_5784393": {
				"status": "down",
				"ipv4addr": "172.168.1.1",
				"ipv6adr": "20:25:96:12:34:56",
				"subnet": "192.168.1.0/24"
			}
		}
	}`)

	out, err := BackToFront(json.RawMessage(in), plugin)

	if err == nil {
		t.Fatalf("Invalid input did not create error. Output %s. Error: %s.", out, err)
	}

}

func TestBackToFrontValidData(t *testing.T) {
	in := `{
		"mostRecentUpdate": "2024-02-14 23:35:53",
		"assets": {
			"AID_4123523": {
				"Name": "PC-A",
				"Owner": "UID_2332",
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"criticality": 2        
			},
			"AID_5784393": {
				"Name": "Chromecast",
				"Owner": "UID_2332",
				"Created at": "2024-02-10 20:04:20",
				"Updated at": "2024-02-14 23:00:30",
				"criticality": 1
			},
			"AID_9823482": {
				"Name": "Password Vault",
				"Owner": "UID_2332",
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"criticality": 4
			}
		},
		"plugins": {
			"ipScan": {
				"pluginStateID": "20240214-1300A"
			},
			"macScan": {
				"pluginStateID": "20240215-0800G"
			}
		},
		"relations": {
			"RID_2613785": {
				"from": "ID_4123523",
				"to": "ID_5784393",
				"direction": "uni",
				"owner": "UID_2332",
				"dateCreated":"2024-02-14 23:35:53"
			},
			"RID_6492733": {
				"from": "ID_5784393",
				"to": "ID_9823482",
				"direction": "bi",
				"owner": "UID_6372",
				"dateCreated": "2024-01-22 07:32:32"
			}    
		}    
	}
	`
	var hardcodedScan = json.RawMessage(`
	{
		"stateID": "20240214-1300A",
		"dateCreated": "2024-02-14 23:00:00",
		"dateUpdated": "2024-02-14 23:00:30",
		"state": {
			"AID_4123523": {
				"status": "up",
				"ipv4addr": "192.168.1.1",
				"ipv6addr": "10:25:96:12:34:56",
				"subnet": "192.168.1.0/24"
			},
			"AID_5784393": {
				"status": "down",
				"ipv4addr": "172.168.1.1",
				"ipv6addr": "20:25:96:12:34:56",
				"subnet": "192.168.1.0/24"
			}
		}
	}`)
	plugin := make(map[string]json.RawMessage)
	plugin["netscan"] = hardcodedScan

	want := `{
		"assets": {
			"AID_4123523": {
				"plugins": {
					"ipv4addr": "192.168.1.1",
					"ipv6addr": "10:25:96:12:34:56",
					"status": "up",
					"subnet": "192.168.1.0/24"
				},
				"properties": {
					"criticality": 2,
					"Created at": "2024-02-14 23:00:00",
					"Updated at": "2024-02-14 23:00:30",
					"Name": "PC-A",
					"Owner": "UID_2332"
				}
			},
			"AID_5784393": {
				"plugins": {
					"ipv4addr": "172.168.1.1",
					"ipv6addr": "20:25:96:12:34:56",
					"status": "down",
					"subnet": "192.168.1.0/24"
				},
				"properties": {
					"criticality": 1,
					"Created at": "2024-02-10 20:04:20",
					"Updated at": "2024-02-14 23:00:30",
					"Name": "Chromecast",
					"Owner": "UID_2332"
				}
			},
			"AID_9823482": {
				"plugins": {
				},
				"properties": {
					"criticality": 4,
					"Created at": "2024-02-14 23:00:00",
					"Updated at": "2024-02-14 23:00:30",
					"Name": "Password Vault",
					"Owner": "UID_2332"
				}
			}
		},
		"mostRecentUpdate": "2024-02-14 23:35:53",
		"pluginList": [
			"netscan"
		],
		"relations": {
			"RID_2613785": {
				"dateCreated": "2024-02-14 23:35:53",
				"direction": "uni",
				"from": "ID_4123523",
				"Owner": "UID_2332",
				"to": "ID_5784393"
			},
			"RID_6492733": {
				"dateCreated": "2024-01-22 07:32:32",
				"direction": "bi",
				"from": "ID_5784393",
				"Owner": "UID_6372",
				"to": "ID_9823482"
			}
		}
	}`

	out, err := BackToFront(json.RawMessage(in), plugin)
	diff, err2 := jsondiff.Compare(out, json.RawMessage(want))

	if err != nil || err2 != nil || diff != nil {
		t.Fatalf("Input did not create correct output. Difference is %s. Error: %s.", diff.String(), err)
	}

}

func TestBackToFrontEmpty(t *testing.T) {
	out, err := BackToFront(nil, nil)
	if err == nil {
		t.Fatalf(`BackToFront("") = %q, %v, want "", error`, out, err)
	}
}
