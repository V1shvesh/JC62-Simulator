const CodeFlask = require('codeflask')

const ISA = {
	LDA: 0x100,
	STA: 0x200,
	MBA: 0x300,
	ADD: 0x400,
	SUB: 0x500,
	JMP: 0x600,
	JN: 0x700,
	HLT: 0xFFF
}

let addToInt = (address) => {
	address = address.trim()
	let int = parseInt(address.slice(0,2),16)
	if(address.length>3||!isNaN(address[2])||address.length<2||/[^0-9A-Fh]/.test(address)||isNaN(int))
		throw 'Invalid Address'
	return int
}

let dataToInt = (data) => {
	data = data.trim()
	let int = parseInt(data.slice(0,3),16)
	if(data.length>4||(isNaN(data[2])&&!"ABCDEF".includes(data[2]))||data.length<3||/[^0-9A-Fh]/.test(data)||isNaN(int))
		throw "Invalid Data"
	return int
}

let showData = (data) => {
	$('.memory.table tbody').html("")
	data.ram.forEach((ele, index) => {
		if(ele!==0){
			ele = ele.toString(16).toUpperCase()
			index = index.toString(16).toUpperCase()
			ele = ("00" + ele).slice(-3)
			index = ("0" + index).slice(-2)
			let row = "<tr>"
			ele = "<td>"+ele+"</td>"
			index = "<td>"+index.toString(16).toUpperCase()+"</td>"
			row += index+ele+"</tr>"
			$('.memory.table tbody').append(row)
		}
	})
	let A = data.A.toString(2)
	let B = data.B.toString(2)
	let N = data.N?"1":"0"
	let PC = data.pc.toString(2)
	$('#reg-A').text(("00000000000"+A).slice(-12))
	$('#reg-B').text(("00000000000"+B).slice(-12))
	$('#flag-N').text(N)
	$('.pc-data').text(("0000000"+PC).slice(-8))
	return data
}

let resetData = (data) => {
	for (var i = 0; i < data.ram.length; i++) { 
		data.ram[i] = 0x000
		data.A = 0x000
		data.B = 0x000
		data.N = 0x000
	}
	// Reset Table
	$('.instruction.table tbody').html("")
	$('.memory.table tbody').html("")
	return data
}

let addInstruction = (address,line,hex) => {
	address = address.toString(16).toUpperCase()
	hex = hex.toString(16).toUpperCase()
	address = ("0" + address).slice(-2)
	hex = ("00" + hex).slice(-3)

	// Create a new Row
	let row = "<tr id='"+address+"'>"
	address = "<td>"+address+"</td>"
	line = "<td>"+line+"</td>"
	hex = "<td>"+hex+"</td>"
	row += address+line+hex+"</tr>"

	// Appends to the Instruction Table
	$('.instruction.table tbody').append(row)
}

let convertToISA = (line, lineNo, address) => {
	let inst = line.split(' ')
	inst[0] = inst[0].trim()
	let hex = 0x000

	if(inst[0] in ISA){
		hex += ISA[inst[0]]
	} else {
		throw 'Incorrect syntax at line no. : ' + (lineNo + 1);
	}
	// Address not specified
	// TODO - Debug for HLT
	if(![0x300,0x400,0x500,0xFFF].includes(hex)&&inst[1] === undefined){
		// console.log(((hex in [0x300,0xfff])), inst[1])
		throw 'Address not specified'
	}

	if(inst[1] !== undefined){
		hex += addToInt(inst[1],16)
	}

	addInstruction(address, line, hex)

	return hex.toString(16).toUpperCase();
}

let databytes = (words,cur_address,memory) => {
	words.forEach((ele) => {
		ele = dataToInt(ele)
		memory[cur_address] = ele
		cur_address++
	})
	return cur_address
}

let assemble = (code,data) => {
	let lines = code.trim().split('\n')
	lines = lines.map((ele) => {
		return ele.trim()
	})

	//Reset Data
	data = resetData(data)

	// Instruction Conversion and Write To RAM
	let cur_address = 0x000
	let pc = -1
	let hltFlag = false
	try{
	    lines.forEach((ele, lineNo) => {
	    	if(cur_address >= 256){
	    		throw "Address out of bounds"
	    	}
			if(ele.split(' ')[0] === "#ORG"){
				if(ele.split(' ')[1] === undefined){
					throw 'Address not defined'
				}
				cur_address = addToInt(ele.split(' ')[1])
				return
			}
			if(ele.split(' ')[0] === "#DB"){
				cur_address = databytes(ele.split(' ').slice(1), cur_address,data.ram)
			}
			if(ele.slice(0,1)!== '#'){
				pc = pc>0?pc:cur_address
				data.ram[cur_address] = convertToISA(ele, lineNo, cur_address)
				if(data.ram[cur_address] === "FFF") 
					hltFlag = true
				cur_address++
				return
			}
		})
		if(!hltFlag)
			throw "HLT instruction not found"
	} catch(e) {
		resetData(data)
		console.log(e)
	}
	data.pc = pc
	return data
}
// TODO - vvvvv This vvvvv
let run = (data) => {
	try{
		while(data.ram[data.pc] !== "FFF"){
			$('.instruction.table tr').removeClass("row-selected")
			$('#'+data.pc.toString(16).toUpperCase()).addClass("row-selected")
			let opcode = Math.floor(parseInt(data.ram[data.pc],16)/256)
			let address = parseInt(data.ram[data.pc],16)%256
			data.pc++
			//Swich Cases
			switch(opcode){
				// LDA
				case 1: 
				data.A = data.ram[address]
				break
				case 2:
				data.ram[address] = data.A
				break
				case 3:
				data.B = data.A
				break
				case 4:
				data.A = (data.A + data.B)%4096
				if(data.A>0x7FF)
					data.N = true
				break
				case 5:
				let oprand = 0x800 - data.B
				data.A = (data.A + oprand)%4096
				console.log(data.A)
				if(data.A>0x7FF)
					data.N = true
				break
				case 6:
				data.pc = address-1
				break
				case 7:
				if(data.N)
					data.pc = address-1
				break
			}
		}
		$('.instruction.table tr').removeClass("row-selected")
		$('#'+data.pc.toString(16).toUpperCase()).addClass("row-selected-hlt")
		showData(data)
	} catch(e) {
		console.log(e)
	}
	return data
} 

let step = (data) =>{
	try{
		if(data.ram[data.pc] === "FFF"){
			$('.instruction.table tr').removeClass("row-selected")
			$('#'+data.pc.toString(16).toUpperCase()).addClass("row-selected-hlt")
			return data
		}
			
		$('.instruction.table tr').removeClass("row-selected")
		$('#'+data.pc.toString(16).toUpperCase()).addClass("row-selected")
		let opcode = Math.floor(parseInt(data.ram[data.pc],16)/256)
		let address = parseInt(data.ram[data.pc],16)%256
		data.pc++
		//Swich Cases
		switch(opcode){
			// LDA
			case 1: 
			data.A = data.ram[address]
			break
			case 2:
			data.ram[address] = data.A
			break
			case 3:
			data.B = data.A
			break
			case 4:
			data.A = (data.A + data.B)%4096
			if(data.A>0x7FF)
				data.N = true
			break
			case 5:
			let oprand = 0x800 - data.B
			data.A = (data.A + oprand)%4096
			console.log(data.A)
			if(data.A>0x7FF)
				data.N = true
			break
			case 6:
			data.pc = address-1
			break
			case 7:
			if(data.N)
				data.pc = address-1
			break
		}
		showData(data)
	} catch(e) {
		console.log(e)
	}
	return data
}

let stop = () => {
	$('.instruction.table tr').removeClass("row-selected row-selected-hlt")
}

$('document').ready(()=>{
	
	let codeText = ""
	let cpu_data = {
		ram: new Array(256),
		A: 0x000,
		B: 0x000,
		N: false,
		pc: 0x00,
		start: 0x00
	}
	let backup_data = {}
	let flask = new CodeFlask
	flask.run('#editor', {language: 'jc62', rtl: false})
	flask.onUpdate((code) => {
		codeText = code
	})


	// Click Handlers
	$('#btn-assemble').click((e)=>{
		e.preventDefault()
		
		if(codeText.trim() === '')
			return false

		cpu_data = assemble(codeText,cpu_data)
		showData(cpu_data)
		backup_data = JSON.parse(JSON.stringify(cpu_data))

		$('#asmtab').trigger('click')
	})
	$('#editab').click((e)=>{
		$('#assembler-pane').hide()
		$('#editor-pane').show()
	})
	$('#asmtab').click((e)=>{
		$('#editor-pane').hide()
		$('#assembler-pane').show()
	})
	$('#editor').keydown((e) => {
		if(e.ctrlKey&&e.charCode === 0&&e.keyCode === 13)
			$('#btn-assemble').trigger('click')
	})
	$('#btn-run').click((e) => {
		cpu_data = run(cpu_data)
	})
	$('#btn-step').click((e) => {
		cpu_data = step(cpu_data)
	})
	$('#btn-stop').click((e) => {
		console.log(backup_data)
		stop()
		cpu_data = JSON.parse(JSON.stringify(backup_data))
		showData(cpu_data)
	})
})