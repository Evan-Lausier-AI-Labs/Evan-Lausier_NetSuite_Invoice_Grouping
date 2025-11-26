/**
 * Author: Evan Lausier
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/search', 'N/ui/serverWidget'],
	function(record, log, search, ui) {

		function beforeLoad(context) {
			try {

				if (context.type !== context.UserEventType.PRINT) return;

				var recId = context.newRecord.id;
				var fieldObj = context.form.addField({
					id: "custpage_custom_lines",
					label: 'Custom Lines',
					type: ui.FieldType.INLINEHTML,
				})
				var customLines = getineData(recId)
				log.debug("customLines", customLines)
				fieldObj.defaultValue = JSON.stringify(customLines);

			} catch (e) {
				log.error('error in beforeLoad', e)
			}
		}

		function getineData(recId) {

			try {
				var lineDataArr = [];

				var invRecObj = record.load({
					type: 'invoice',
					id: recId
				});

				var lineCount = invRecObj.getLineCount('item');

				for (var i = 0; i < lineCount; i++) {
					var projectName = invRecObj.getSublistValue('item', 'job_display', i);
					var item = invRecObj.getSublistValue('item', 'item_display', i);
					var description = invRecObj.getSublistValue('item', 'description', i);
					var quantity = parseFloat(invRecObj.getSublistValue('item', 'quantity', i)) || 0;
					var rate = invRecObj.getSublistValue('item', 'rate', i) || 0;
					var amount = parseFloat(invRecObj.getSublistValue('item', 'amount', i));


					if (i == 0) {
						lineDataArr.push({
							projectName: projectName,
							item: item,
							description: description,
							quantity: quantity,
							rate: rate,
							amount: amount
						});
					} else {
						var index = -1;

						for (var k in lineDataArr) {
							if (lineDataArr[k].projectName == projectName &&
								lineDataArr[k].item == item &&
								lineDataArr[k].description == description &&
								lineDataArr[k].rate == rate) {
								index = k;
								break;
							}
						}

						if (index > -1) {
							lineDataArr[index].amount = lineDataArr[index].amount + amount;
							lineDataArr[index].quantity = lineDataArr[index].quantity + quantity;
						} else {
							lineDataArr.push({
								projectName: projectName,
								item: item,
								description: description,
								quantity: quantity,
								rate: rate,
								amount: amount
							});
						}
					}




				}

				// Updating rate

				/*for (var k = 0; k < lineDataArr.length; k++) {

					if (lineDataArr[k].quantity > 0)
						lineDataArr[k].rate = lineDataArr[k].amount / lineDataArr[k].quantity
					else
						lineDataArr[k].rate = ''

				}
*/
				var newLineDataArr = [];
				var firstProj;
				for (var k = 0; k < lineDataArr.length; k++) {

					if (k == 0) {
						newLineDataArr.push(lineDataArr[k]);

					} else {
						if (firstProj == lineDataArr[k].projectName) {
							newLineDataArr.push({
								projectName: "",
								item: lineDataArr[k].item,
								description: lineDataArr[k].description,
								quantity: lineDataArr[k].quantity,
								rate: lineDataArr[k].rate,
								amount: lineDataArr[k].amount
							});
						} else {
							newLineDataArr.push({
								projectName: lineDataArr[k].projectName,
								item: lineDataArr[k].item,
								description: lineDataArr[k].description,
								quantity: lineDataArr[k].quantity,
								rate: lineDataArr[k].rate,
								amount: lineDataArr[k].amount
							});
						}
					}
					firstProj = lineDataArr[k].projectName;

				}

				return newLineDataArr;
			} catch (e) {
				log.error('error in getineData', e)
			}
		}

		function getineDataOLD(recId) {
			try {
				var lineDataArr = [];
				var invoiceSearchObj = search.create({
					type: "invoice",
					filters: [
						["type", "anyof", "CustInvc"],
						"AND", ["mainline", "is", "F"],
						"AND", ["internalid", "anyof", recId],
						"AND", ["taxline", "is", "F"]
					],
					columns: [
						search.createColumn({
							name: "altname",
							join: "job",
							summary: "GROUP"
						}),
						search.createColumn({
							name: "entityid",
							join: "job",
							summary: "GROUP"
						}),
						search.createColumn({
							name: "item",
							summary: "GROUP"
						}),
						search.createColumn({
							name: "memo",
							summary: "GROUP"
						}),
						search.createColumn({
							name: "quantity",
							summary: "SUM"
						}),
						search.createColumn({
							name: "rate",
							summary: "MAX"
						}),
						search.createColumn({
							name: "amount",
							summary: "SUM"
						}),
						search.createColumn({
							name: "linesequencenumber",
							summary: "MAX",
							sort: search.Sort.ASC
						})
					]
				});
				var searchResultCount = invoiceSearchObj.runPaged().count;
				log.debug("invoiceSearchObj result count", searchResultCount);
				invoiceSearchObj.run().each(function(result) {

					var projectName = result.getValue({
						name: "altname",
						join: "job",
						summary: "GROUP"
					});

					log.debug('projectName', projectName)

					/*if (projectName && projectName != '- None -')
						projectName = projectName.split(':')[0];

					else */
					if (projectName == '- None -')
						projectName = '';

					var description = result.getValue({
						name: "memo",
						summary: "GROUP"
					});
					var item = result.getText({
						name: "item",
						summary: "GROUP"
					});

					var quantity = result.getValue({
						name: "quantity",
						summary: "SUM"
					}) || ''
					var rate = result.getValue({
						name: "rate",
						summary: "MAX"
					}) || ''
					var amount = result.getValue({
						name: "amount",
						summary: "SUM"
					});
					if (amount) amount = parseFloat(amount);
					else amount = '';
					if (rate) rate = parseFloat(rate);
					else rate = '';
					if (quantity) quantity = parseFloat(quantity);
					else quantity = '';

					lineDataArr.push({
						projectName: projectName,
						item: item,
						description: description,
						quantity: quantity,
						rate: rate,
						amount: amount
					});
					return true;
				});

				//	return lineDataArr;



				var newLineDataArr = [];
				var firstProj;
				for (var k = 0; k < lineDataArr.length; k++) {

					if (k == 0) {
						newLineDataArr.push(lineDataArr[k]);

					} else {
						if (firstProj == lineDataArr[k].projectName) {
							newLineDataArr.push({
								projectName: "",
								item: lineDataArr[k].item,
								description: lineDataArr[k].description,
								quantity: lineDataArr[k].quantity,
								rate: lineDataArr[k].rate,
								amount: lineDataArr[k].amount
							});
						} else {
							newLineDataArr.push({
								projectName: lineDataArr[k].projectName,
								item: lineDataArr[k].item,
								description: lineDataArr[k].description,
								quantity: lineDataArr[k].quantity,
								rate: lineDataArr[k].rate,
								amount: lineDataArr[k].amount
							});
						}
					}
					firstProj = lineDataArr[k].projectName;

				}

				return newLineDataArr;
			} catch (e) {
				log.error('error in getineData', e)
			}
		}
		return {
			beforeLoad: beforeLoad
		};
	});