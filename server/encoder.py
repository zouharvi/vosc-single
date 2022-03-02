from transformers import AutoTokenizer, AutoModel
import torch

MODEL = None
DEVICE = "cuda:0"

def mean_pooling(model_output, attention_mask, layer_i=0):
    # Mean Pooling - Take attention mask into account for correct averaging
    # first element of model_output contains all token embeddings
    token_embeddings = model_output[layer_i]
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(
        token_embeddings.size()
    ).float()
    sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)
    sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
    return (sum_embeddings / sum_mask).reshape(-1)

class SentenceBertWrap():
    def __init__(self):
        self.tokenizer = AutoTokenizer.from_pretrained(
            "sentence-transformers/bert-base-nli-cls-token")
        self.model = AutoModel.from_pretrained(
            "sentence-transformers/bert-base-nli-cls-token")
        self.model.train(False)
        self.model.to(DEVICE)

    def encode(self, sentence, type_out):
        encoded_input = self.tokenizer(
            sentence,
            padding=True,
            truncation=True,
            max_length=128,
            return_tensors='pt'
        )
        encoded_input = encoded_input.to(DEVICE)
        with torch.no_grad():
            output = self.model(**encoded_input)
        if type_out == "cls":
            return output[0][0, 0].cpu().numpy()
        elif type_out == "pooler":
            return output["pooler_output"][0].cpu().numpy()
        elif type_out == "tokens":
            sentence_embedding = mean_pooling(
                output, encoded_input['attention_mask']
            )
            return sentence_embedding.cpu().numpy()
        else:
            raise Exception("Unknown type out")


def encode(text):
    global MODEL

    if MODEL is None:
        MODEL = SentenceBertWrap()
    
    return [float(x) for x in MODEL.encode(text, type_out="tokens")]