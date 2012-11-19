
guidedModel =// @startlock
{
	Item :
	{
		methods :
		{// @endlock
			getItems:function()
			{// @lock
				
				var Items = ds.Item.toArray();
				return Items;
			}// @startlock
		}
	}
};// @endlock
