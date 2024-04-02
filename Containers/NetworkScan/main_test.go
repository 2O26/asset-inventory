package main

import (

	"testing"
	

)

func TestValidNmapTarget(t *testing.T) {
     tests := []struct {
	      target string
		  result bool
	 }{
		  {"192.168.1.49", true},
		  {"192.168.1.0/24", true},
		  {"172.15.1.1-100", true},
		  {"10.10.1.145", true},
		  {"0.0.0.0", true},
		  {"0.255.255.255",true},
		  {"10.0.0.0/8", true},
		  {"1.0.0.0", true},
		  {"172.15.1.1-172.15.1.100", false},
		  {"a string", false},
		  {"a.st.ri.ng", false},
		  {"a.st.ri.ng/24", false},
		  {"a.st.ri.ng-100", false},
		  {"", false},
		  {"2001:db8::1", false},
		  {"`172.15.1.1-100` ; DROP TABLE users; -- ", false},
	 }

	 for _, test := range tests {
		  valid := validNmapTarget(test.target)
		  if valid != test.result{
				t.Errorf("nmap Target: %s is %t it should be %t", test.target, valid, test.result)
		  }
	 }
}